from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q
from django.utils import timezone
from .serializers import (
    UserSerializer, UserDetailSerializer, ProfileSerializer,
    BusinessSerializer, ReviewSerializer,
    MyTokenObtainPairSerializer, ChangePasswordSerializer, BookmarkSerializer
)
from .models import CustomUser, Business, Review, Bookmark, SystemSettings, OwnerCoinPurchaseRequest, CustomerPayoutRequest, WalletCredit, ContactSubmission, SupportThread, SupportMessage
from .blockchain_service import store_review_hash


# ================================================================
# HELPER
# ================================================================
def is_admin(user):
    """Returns True if user is a Django superuser or has role='admin'."""
    return user.is_authenticated and (user.is_superuser or getattr(user, 'role', '') == 'admin')


# ================================================================
# AUTHENTICATION
# ================================================================
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer


class LoginView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = (permissions.AllowAny,)


# ================================================================
# MY PROFILE (authenticated user's own profile)
# ================================================================
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change authenticated user's password."""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password updated successfully.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_account(request):
    """Allow authenticated user to permanently delete their own account."""
    user = request.user
    user.delete()
    return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


# ================================================================
# BOOKMARKS
# ================================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_bookmarks(request):
    """Get all bookmarks for the authenticated user."""
    bookmarks = Bookmark.objects.filter(user=request.user).select_related('business').order_by('-created_at')
    serializer = BookmarkSerializer(bookmarks, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_bookmark(request, business_id):
    """Add a business to bookmarks."""
    try:
        business = Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)
    bookmark, created = Bookmark.objects.get_or_create(user=request.user, business=business)
    if not created:
        return Response({'detail': 'Already bookmarked.'}, status=status.HTTP_200_OK)
    return Response({'detail': 'Bookmarked successfully.', 'id': bookmark.id}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_bookmark(request, business_id):
    """Remove a business from bookmarks."""
    deleted, _ = Bookmark.objects.filter(user=request.user, business_id=business_id).delete()
    if deleted:
        return Response({'detail': 'Bookmark removed.'})
    return Response({'detail': 'Bookmark not found.'}, status=status.HTTP_404_NOT_FOUND)


# ================================================================
# ADMIN WALLET
# ================================================================
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_admin_wallet(request):
    """Return the admin's MetaMask wallet address (public)."""
    address = SystemSettings.get('admin_wallet_address', '')
    return Response({'admin_wallet_address': address})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def set_admin_wallet(request):
    """Admin can set their MetaMask wallet address."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    address = request.data.get('wallet_address', '').strip()
    if not address:
        return Response({'detail': 'wallet_address is required.'}, status=status.HTTP_400_BAD_REQUEST)
    SystemSettings.set('admin_wallet_address', address)
    # Also save to the admin user record
    request.user.wallet_address = address
    request.user.save()
    return Response({'detail': 'Admin wallet address saved.', 'admin_wallet_address': address})


# ================================================================
# ADMIN FINANCIALS (coin balance, transfer, exchange rate)
# ================================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_financials(request):
    """Admin: get coin supply, admin balance, exchange rate."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    admin_balance = float(SystemSettings.get('admin_coin_balance', '20000'))
    total_supply = float(SystemSettings.get('total_coin_supply', '20000'))
    exchange_rate = int(SystemSettings.get('exchange_rate', '100'))
    return Response({
        'admin_balance': admin_balance,
        'total_coin_supply': total_supply,
        'exchange_rate': exchange_rate,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_exchange_rate(request):
    """Admin: set exchange rate (PKR per RTC). 1 RTC = rate PKR."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    rate = request.data.get('exchange_rate')
    if rate is None:
        return Response({'detail': 'exchange_rate is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        rate = int(rate)
        if rate < 1:
            raise ValueError("Rate must be positive")
    except (ValueError, TypeError):
        return Response({'detail': 'Invalid exchange rate.'}, status=status.HTTP_400_BAD_REQUEST)
    SystemSettings.set('exchange_rate', str(rate))
    return Response({'detail': f'Exchange rate updated: 1 RTC = {rate} PKR.', 'exchange_rate': rate})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_transfer_coins(request):
    """Admin: transfer RTC to a wallet address. Deducts from admin balance."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    wallet = request.data.get('wallet_address', '').strip()
    amount = request.data.get('amount')
    if not wallet or len(wallet) < 10:
        return Response({'detail': 'Valid wallet_address is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError("Amount must be positive")
    except (ValueError, TypeError):
        return Response({'detail': 'Valid amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
    current = float(SystemSettings.get('admin_coin_balance', '20000'))
    if amount > current:
        return Response({'detail': 'Insufficient admin balance.'}, status=status.HTTP_400_BAD_REQUEST)
    new_balance = current - amount
    SystemSettings.set('admin_coin_balance', str(new_balance))
    WalletCredit.objects.create(wallet_address=wallet.strip().lower(), amount=amount, source='transfer')
    return Response({
        'detail': f'Transferred {amount:.0f} RTC to {wallet[:10]}...',
        'admin_balance': new_balance,
    })


# ================================================================
# ADMIN PAYMENT DETAILS (shown to owners for buying coins)
# ================================================================
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_admin_payment_details(request):
    """Public: owner/customer page fetches admin payment details."""
    return Response({
        'admin_wallet_address': SystemSettings.get('admin_wallet_address', ''),
        'bank_name': SystemSettings.get('admin_bank_name', 'HBL'),
        'account_title': SystemSettings.get('admin_account_title', 'ChainProof Admin'),
        'account_number': SystemSettings.get('admin_account_number', '0123-4567-8901'),
        'mobile_payment_number': SystemSettings.get('admin_mobile_number', '0300-1234567'),
        'mobile_payment_title': SystemSettings.get('admin_mobile_title', 'Admin Name'),
        'mobile_payment_type': SystemSettings.get('admin_mobile_payment_type', 'EasyPaisa'),  # EasyPaisa or JazzCash
        'pkr_per_rtc': int(SystemSettings.get('admin_pkr_per_rtc', '150')),
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_admin_payment_details(request):
    """Admin: save payment details (shown to owners)."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    data = request.data
    mapping = {
        'bankName': 'admin_bank_name',
        'accountTitle': 'admin_account_title',
        'accountNumber': 'admin_account_number',
        'mobilePaymentNumber': 'admin_mobile_number',
        'mobilePaymentTitle': 'admin_mobile_title',
        'mobilePaymentType': 'admin_mobile_payment_type',
        'pkrPerRtc': 'admin_pkr_per_rtc',
    }
    for k, sys_key in mapping.items():
        if k in data:
            SystemSettings.set(sys_key, str(data[k] or ''))
    return Response({'detail': 'Payment details saved.'})


# ================================================================
# OWNER COIN PURCHASE REQUEST
# ================================================================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def owner_request_buy_coins(request):
    """Owner: submit a request to buy coins from admin. Accepts JSON or multipart (with payment_proof screenshot)."""
    if request.user.role != 'owner':
        raise PermissionDenied("Owner access required.")
    data = request.data
    coins = data.get('coins_requested')
    amount_pkr = data.get('amount_paid_pkr')
    wallet = (data.get('wallet_address') or '').strip()
    business_id = data.get('business_id')
    payment_method = data.get('payment_method', '')
    provider_name = data.get('provider_name', '')
    account_title = data.get('account_title', '')
    account_number = data.get('account_number', '')
    payment_proof = request.FILES.get('payment_proof_image')
    if not coins or not wallet or len(wallet) < 10:
        return Response({'detail': 'coins_requested, amount_paid_pkr, and wallet_address required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        coins = int(coins)
        amount_pkr = float(amount_pkr)
    except (ValueError, TypeError):
        return Response({'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)
    business = None
    if business_id:
        try:
            business = Business.objects.get(id=business_id, owner=request.user)
        except Business.DoesNotExist:
            pass
    req = OwnerCoinPurchaseRequest.objects.create(
        owner=request.user,
        business=business,
        coins_requested=coins,
        amount_paid_pkr=amount_pkr,
        wallet_address=wallet,
        payment_method=payment_method,
        provider_name=provider_name,
        account_title=account_title,
        account_number=account_number,
    )
    if payment_proof:
        req.payment_proof_image = payment_proof
        req.save(update_fields=['payment_proof_image'])
    return Response({'detail': 'Purchase request submitted.', 'id': req.id})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_owner_wallet_balance(request):
    """Owner: get balance = sum(WalletCredit for their wallet) - rewarded reviews."""
    if request.user.role != 'owner':
        raise PermissionDenied("Owner access required.")
    wallet = (request.user.wallet_address or '').strip()
    if not wallet or len(wallet) < 10:
        return Response({'balance': 0, 'credits': 0, 'spent': 0})
    wallet_lower = wallet.lower()
    credits = sum(
        float(wc.amount) for wc in
        WalletCredit.objects.filter(wallet_address__iexact=wallet_lower)
    )
    businesses = Business.objects.filter(owner=request.user)
    spent = Review.objects.filter(business__in=businesses, is_rewarded=True).count()
    balance = max(0, credits - spent)
    return Response({'balance': balance, 'credits': credits, 'spent': spent})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_owner_transactions(request):
    """Owner: get combined transaction history (admin-to-owner purchases + owner-to-customer rewards)."""
    if request.user.role != 'owner':
        raise PermissionDenied("Owner access required.")
    wallet = (request.user.wallet_address or '').strip()
    transactions = []
    if wallet and len(wallet) >= 10:
        wallet_lower = wallet.lower()
        # Admin-to-owner: WalletCredit records
        for wc in WalletCredit.objects.filter(wallet_address__iexact=wallet_lower).order_by('-created_at'):
            transactions.append({
                'id': f'credit-{wc.id}',
                'type': 'purchased',
                'amount': float(wc.amount),
                'description': 'Coin purchase from admin',
                'date': wc.created_at.strftime('%Y-%m-%d'),
                'status': 'completed',
            })
    # Owner-to-customer: rewarded reviews
    businesses = Business.objects.filter(owner=request.user)
    for r in Review.objects.filter(business__in=businesses, is_rewarded=True).select_related('user', 'business'):
        transactions.append({
            'id': r.id,
            'type': 'spent',
            'amount': -1.00,
            'description': f'Reward to reviewer "{r.user.username}" for {r.business.name}',
            'date': r.created_at.strftime('%Y-%m-%d') if r.created_at else '',
            'status': 'completed',
        })
    # Sort by date descending
    transactions.sort(key=lambda t: t['date'], reverse=True)
    return Response(transactions)


# ================================================================
# CUSTOMER PAYOUT REQUEST (sell coins to admin)
# ================================================================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def customer_request_sell_coins(request):
    """Customer: submit a request to sell coins to admin."""
    if request.user.role != 'customer':
        raise PermissionDenied("Customer access required.")
    coins = request.data.get('coins_to_sell')
    payment_method = request.data.get('payment_method', '')  # JazzCash, EasyPaisa, Bank
    provider_name = request.data.get('provider_name', '')
    account_title = request.data.get('account_title', '')
    account_number = request.data.get('account_number', '')
    if not coins or int(coins) <= 0:
        return Response({'detail': 'coins_to_sell required.'}, status=status.HTTP_400_BAD_REQUEST)
    approved_count = Review.objects.filter(user=request.user, status='Approved').count()
    bonus = getattr(request.user, 'bonus_coins', 0) or 0
    already_sold = sum(
        r.coins_to_sell for r in
        CustomerPayoutRequest.objects.filter(customer=request.user, status='Completed')
    )
    available = approved_count + bonus - already_sold
    if int(coins) > available:
        return Response({'detail': f'You can only sell up to {available} coins (already sold {already_sold}).'}, status=status.HTTP_400_BAD_REQUEST)
    req = CustomerPayoutRequest.objects.create(
        customer=request.user,
        coins_to_sell=int(coins),
        payment_method=payment_method,
        provider_name=provider_name,
        account_title=account_title,
        account_number=account_number,
    )
    return Response({'detail': 'Payout request submitted.', 'id': req.id})


# ================================================================
# ADMIN: GET PURCHASE & PAYOUT REQUESTS (no customer-owner review tx)
# ================================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_get_purchase_requests(request):
    """Admin: list owner coin purchase requests."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    reqs = OwnerCoinPurchaseRequest.objects.all().order_by('-created_at')
    data = []
    for r in reqs:
        proof_url = None
        if r.payment_proof_image:
            proof_url = request.build_absolute_uri(r.payment_proof_image.url)
        data.append({
            'id': r.id,
            'requester': f'{r.owner.username} → {r.business.name if r.business else "N/A"}',
            'coins_requested': r.coins_requested,
            'amount_paid_pkr': float(r.amount_paid_pkr),
            'wallet_address': r.wallet_address,
            'payment_method': r.payment_method,
            'provider_name': r.provider_name,
            'account_title': r.account_title,
            'account_number': r.account_number,
            'payment_proof_url': proof_url,
            'status': r.status,
            'date': r.created_at.isoformat(),
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_get_payout_requests(request):
    """Admin: list customer payout requests (sell coins to admin)."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    reqs = CustomerPayoutRequest.objects.all().order_by('-created_at')
    data = []
    for r in reqs:
        data.append({
            'id': r.id,
            'customer': r.customer.username,
            'coins_to_sell': r.coins_to_sell,
            'payment_method': r.payment_method,
            'provider_name': r.provider_name,
            'account_title': r.account_title,
            'account_number': r.account_number,
            'status': r.status,
            'date': r.created_at.isoformat(),
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_complete_purchase_request(request, pk):
    """Admin: mark purchase request as completed (after sending coins via transfer form)."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    try:
        req = OwnerCoinPurchaseRequest.objects.get(pk=pk)
    except OwnerCoinPurchaseRequest.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if req.status == 'Completed':
        return Response({'detail': 'Already completed.'}, status=status.HTTP_400_BAD_REQUEST)
    req.status = 'Completed'
    req.completed_at = timezone.now()
    req.save()
    return Response({'detail': 'Purchase request completed.'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_complete_payout_request(request, pk):
    """Admin: mark payout request as completed (after paying customer). Adds coins to admin balance."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    try:
        req = CustomerPayoutRequest.objects.get(pk=pk)
    except CustomerPayoutRequest.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if req.status == 'Completed':
        return Response({'detail': 'Already completed.'}, status=status.HTTP_400_BAD_REQUEST)
    req.status = 'Completed'
    req.completed_at = timezone.now()
    req.save()
    # Add coins back to admin balance (customer sold them)
    current = float(SystemSettings.get('admin_coin_balance', '20000'))
    new_balance = current + req.coins_to_sell
    SystemSettings.set('admin_coin_balance', str(new_balance))
    return Response({'detail': 'Payout request completed.', 'admin_balance': new_balance})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_reject_payout_request(request, pk):
    """Admin: reject a customer payout request."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    try:
        req = CustomerPayoutRequest.objects.get(pk=pk)
    except CustomerPayoutRequest.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if req.status != 'Pending':
        return Response({'detail': 'Can only reject pending requests.'}, status=status.HTTP_400_BAD_REQUEST)
    req.status = 'Rejected'
    req.save()
    return Response({'detail': 'Payout request rejected.'})


# ================================================================
# CUSTOMER WALLET BALANCE (includes bonus)
# ================================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_customer_balance(request):
    """Customer: get coin balance (approved reviews + bonus_coins - already sold)."""
    if request.user.role != 'customer':
        return Response({'detail': 'Customer access required.'}, status=status.HTTP_403_FORBIDDEN)
    approved = Review.objects.filter(user=request.user, status='Approved').count()
    bonus = getattr(request.user, 'bonus_coins', 0) or 0
    already_sold = sum(
        r.coins_to_sell for r in
        CustomerPayoutRequest.objects.filter(customer=request.user, status='Completed')
    )
    balance = approved + bonus - already_sold
    return Response({'balance': max(0, balance), 'from_reviews': approved, 'bonus_coins': bonus})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_credit_customer_coins(request, user_id):
    """Admin: add bonus coins to a customer (for testing)."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    try:
        user = CustomUser.objects.get(pk=user_id, role='customer')
    except CustomUser.DoesNotExist:
        return Response({'detail': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
    amount = request.data.get('amount')
    if amount is None:
        return Response({'detail': 'amount is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        amount = int(amount)
        if amount < 0:
            return Response({'detail': 'Amount must be non-negative.'}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)
    user.bonus_coins = (getattr(user, 'bonus_coins', 0) or 0) + amount
    user.save(update_fields=['bonus_coins'])
    return Response({'detail': f'Added {amount} coins to {user.username}. Total bonus: {user.bonus_coins}.'})


# ================================================================
# CONTACT FORM (public submit, admin sees in Inbox)
# ================================================================
@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_contact_form(request):
    """Public: submit contact form from Contact Us page. No auth required."""
    data = request.data
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    subject = (data.get('subject') or '').strip()
    message = (data.get('message') or '').strip()
    attachment = request.FILES.get('attachment')
    if not name:
        return Response({'detail': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not email:
        return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not subject:
        return Response({'detail': 'Subject is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not message or len(message) < 20:
        return Response({'detail': 'Message must be at least 20 characters.'}, status=status.HTTP_400_BAD_REQUEST)
    sub = ContactSubmission.objects.create(
        name=name,
        email=email,
        subject=subject,
        message=message,
    )
    if attachment:
        sub.attachment = attachment
        sub.save(update_fields=['attachment'])
    return Response({'detail': 'Message sent successfully. We will get back to you within 24 hours.', 'id': sub.id})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_get_contact_submissions(request):
    """Admin: list all contact form submissions for Inbox."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    subs = ContactSubmission.objects.all().order_by('-created_at')
    data = []
    for s in subs:
        att_url = None
        if s.attachment:
            att_url = request.build_absolute_uri(s.attachment.url)
        data.append({
            'id': s.id,
            'name': s.name,
            'email': s.email,
            'subject': s.subject,
            'message': s.message,
            'attachment_url': att_url,
            'status': s.status,
            'created_at': s.created_at.isoformat(),
        })
    return Response(data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_update_contact_submission(request, pk):
    """Admin: mark contact submission as Resolved."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    try:
        sub = ContactSubmission.objects.get(pk=pk)
    except ContactSubmission.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    new_status = request.data.get('status')
    if new_status in ('Open', 'Resolved'):
        sub.status = new_status
        sub.save(update_fields=['status'])
    return Response({'detail': 'Updated.', 'status': sub.status})


# ================================================================
# SUPPORT MESSAGES (in-system: customer/owner <-> admin)
# ================================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_support_messages(request):
    """Customer or Owner: get their support thread and messages."""
    user = request.user
    if user.role not in ('customer', 'owner'):
        raise PermissionDenied("Customers and owners only.")
    thread, _ = SupportThread.objects.get_or_create(user=user)
    messages = thread.messages.all().order_by('created_at')
    # Mark messages not from user (i.e. from admin) as read when user fetches
    for m in messages.exclude(sender=user).filter(is_read=False):
        m.is_read = True
        m.save(update_fields=['is_read'])
    data = {
        'thread_id': thread.id,
        'messages': [{
            'id': m.id,
            'sender_id': m.sender.id,
            'sender_name': m.sender.username,
            'sender_role': m.sender.role,
            'message': m.message,
            'attachment_url': request.build_absolute_uri(m.attachment.url) if m.attachment else None,
            'created_at': m.created_at.isoformat(),
            'is_from_me': m.sender_id == user.id,
        } for m in messages],
    }
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_support_message(request):
    """Customer or Owner: send a message to admin (optionally with attachment)."""
    user = request.user
    if user.role not in ('customer', 'owner'):
        raise PermissionDenied("Customers and owners only.")
    message = (request.data.get('message') or request.POST.get('message') or '').strip()
    if not message or len(message) < 5:
        return Response({'detail': 'Message must be at least 5 characters.'}, status=status.HTTP_400_BAD_REQUEST)
    thread, _ = SupportThread.objects.get_or_create(user=user)
    attachment = request.FILES.get('attachment')
    msg = SupportMessage.objects.create(thread=thread, sender=user, message=message)
    if attachment:
        msg.attachment = attachment
        msg.save(update_fields=['attachment'])
    return Response({'detail': 'Message sent.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_unread_support_count(request):
    """Customer or Owner: count unread messages from admin."""
    user = request.user
    if user.role not in ('customer', 'owner'):
        return Response({'count': 0})
    try:
        thread = SupportThread.objects.get(user=user)
        count = thread.messages.exclude(sender=user).filter(is_read=False).count()
    except SupportThread.DoesNotExist:
        count = 0
    return Response({'count': count})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_get_support_threads(request):
    """Admin: list all support threads (from customers and owners)."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    threads = SupportThread.objects.all().order_by('-updated_at')
    data = []
    for t in threads:
        last_msg = t.messages.order_by('-created_at').first()
        unread = t.messages.filter(sender=t.user, is_read=False).count()  # unread from user to admin
        data.append({
            'id': t.id,
            'user_id': t.user.id,
            'username': t.user.username,
            'email': t.user.email,
            'role': t.user.role,
            'last_message': last_msg.message[:80] + '...' if last_msg and len(last_msg.message) > 80 else (last_msg.message if last_msg else ''),
            'last_at': last_msg.created_at.isoformat() if last_msg else t.updated_at.isoformat(),
            'unread_count': unread,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_get_thread_messages(request, thread_id):
    """Admin: get messages in a support thread."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    try:
        thread = SupportThread.objects.get(pk=thread_id)
    except SupportThread.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    # Mark user's messages as read
    for m in thread.messages.filter(sender=thread.user, is_read=False):
        m.is_read = True
        m.save(update_fields=['is_read'])
    messages = thread.messages.all().order_by('created_at')
    data = {
        'thread': {'id': thread.id, 'user': thread.user.username, 'email': thread.user.email, 'role': thread.user.role},
        'messages': [{
            'id': m.id,
            'sender_id': m.sender.id,
            'sender_name': m.sender.username,
            'sender_role': m.sender.role,
            'message': m.message,
            'attachment_url': request.build_absolute_uri(m.attachment.url) if m.attachment else None,
            'created_at': m.created_at.isoformat(),
            'is_from_user': m.sender_id == thread.user_id,
        } for m in messages],
    }
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_reply_support(request, thread_id):
    """Admin: reply to a support thread."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    try:
        thread = SupportThread.objects.get(pk=thread_id)
    except SupportThread.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    message = (request.data.get('message') or '').strip()
    if not message:
        return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)
    SupportMessage.objects.create(thread=thread, sender=request.user, message=message)
    return Response({'detail': 'Reply sent.'})


# ================================================================
# PUBLIC VIEWS (no authentication required)
# ================================================================
class PublicBusinessListView(generics.ListAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        qs = Business.objects.filter(status='Active')
        search = self.request.query_params.get('search', '')
        category = self.request.query_params.get('category', '')
        if search:
            qs = qs.filter(name__icontains=search)
        if category and category != 'All':
            qs = qs.filter(category__icontains=category)
        return qs


class PublicBusinessDetailView(generics.RetrieveAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    queryset = Business.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# ================================================================
# BUSINESS VIEWS (owner-scoped; admin can see all)
# ================================================================
class BusinessView(generics.ListCreateAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if is_admin(self.request.user):
            qs = Business.objects.all().order_by('-created_at')
            search = self.request.query_params.get('search', '')
            status_filter = self.request.query_params.get('status', '')
            category = self.request.query_params.get('category', '')
            if search:
                qs = qs.filter(name__icontains=search)
            if status_filter and status_filter != 'All':
                qs = qs.filter(status=status_filter)
            if category and category != 'All':
                qs = qs.filter(category__icontains=category)
            return qs
        return Business.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class BusinessDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if is_admin(self.request.user):
            return Business.objects.all()
        return Business.objects.filter(owner=self.request.user)


# ================================================================
# REVIEW VIEWS
# ================================================================
class ReviewView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        business_id = self.kwargs['business_id']
        return Review.objects.filter(business_id=business_id).order_by('-created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        business_id = self.kwargs['business_id']
        business = Business.objects.get(id=business_id)

        raw_content = serializer.validated_data.get('content')
        from .ai_service import rewrite_unethical_review
        clean_content = rewrite_unethical_review(raw_content)

        review = serializer.save(
            user=self.request.user,
            business=business,
            content=clean_content
        )

        blockchain_data = store_review_hash(review.id, review.content)
        if blockchain_data["status"] == "✅ Success":
            review.blockchain_hash = blockchain_data["blockchain_hash"]
            review.transaction_id = blockchain_data["tx_receipt"]

        # Auto-reward: mark as rewarded when submitted successfully
        if review.status == 'Approved':
            review.is_rewarded = True

        review.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_reviews(request):
    """Returns the authenticated customer's own reviews."""
    reviews = Review.objects.filter(user=request.user).order_by('-created_at')
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)


# ================================================================
# ADMIN: USER MANAGEMENT
# ================================================================
class AdminUserListView(generics.ListAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return CustomUser.objects.none()
        qs = CustomUser.objects.all().order_by('-date_joined')
        search = self.request.query_params.get('search', '')
        role = self.request.query_params.get('role', '')
        if search:
            qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search))
        if role and role != 'all':
            qs = qs.filter(role=role)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = CustomUser.objects.all()

    def get_object(self):
        if not is_admin(self.request.user):
            raise PermissionDenied("Admin access required.")
        return super().get_object()


# ================================================================
# ADMIN: REVIEW MODERATION
# ================================================================
class AdminReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return Review.objects.none()
        qs = Review.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search', '')
        status_filter = self.request.query_params.get('status', '')
        if search:
            qs = qs.filter(Q(content__icontains=search) | Q(business__name__icontains=search))
        if status_filter and status_filter != 'All':
            qs = qs.filter(status=status_filter)
        return qs


class AdminReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Review.objects.all()

    def get_object(self):
        if not is_admin(self.request.user):
            raise PermissionDenied("Admin access required.")
        return super().get_object()


# ================================================================
# ADMIN: TRANSFER BUSINESS OWNERSHIP
# ================================================================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def transfer_business_ownership(request, business_id):
    """Admin can reassign a business to a different owner (fix mistaken assignments)."""
    if not is_admin(request.user):
        raise PermissionDenied("Admin access required.")
    new_owner_id = request.data.get('new_owner_id')
    if not new_owner_id:
        return Response({'detail': 'new_owner_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        business = Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)
    try:
        new_owner = CustomUser.objects.get(id=new_owner_id, role='owner')
    except CustomUser.DoesNotExist:
        return Response({'detail': 'New owner must be a user with role Owner.'}, status=status.HTTP_400_BAD_REQUEST)
    business.owner = new_owner
    business.save()
    return Response({
        'detail': f'Business "{business.name}" transferred to {new_owner.username} ({new_owner.email}).',
        'owner': new_owner.username,
        'owner_email': new_owner.email,
    })


# ================================================================
# STATS (Admin + Owner dashboards)
# ================================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_stats(request):
    user = request.user

    if is_admin(user):
        today = timezone.now().date()
        # Real user growth: new signups per day (last 7 days)
        user_growth = []
        for i in range(6, -1, -1):
            d = today - timezone.timedelta(days=i)
            customers = CustomUser.objects.filter(role='customer', date_joined__date=d).count()
            owners = CustomUser.objects.filter(role='owner', date_joined__date=d).count()
            user_growth.append({
                'date': d.isoformat(),
                'label': d.strftime('%b %d'),
                'customers': customers,
                'owners': owners,
            })
        # Real review activity: positive (rating>=4), negative (rating<=2), flagged per day
        review_activity = []
        for i in range(6, -1, -1):
            d = today - timezone.timedelta(days=i)
            day_reviews = Review.objects.filter(created_at__date=d)
            positive = day_reviews.filter(rating__gte=4).count()
            negative = day_reviews.filter(rating__lte=2).count()
            flagged = day_reviews.filter(status='Flagged').count()
            review_activity.append({
                'date': d.isoformat(),
                'label': d.strftime('%b %d'),
                'positive': positive,
                'negative': negative,
                'flagged': flagged,
            })
        # Payout stats
        pending_payouts = CustomerPayoutRequest.objects.filter(status='Pending').count()
        processed_payouts = CustomerPayoutRequest.objects.filter(status='Completed').count()
        data = {
            'totalUsers': {
                'customers': CustomUser.objects.filter(role='customer').count(),
                'owners': CustomUser.objects.filter(role='owner').count(),
            },
            'businessStats': {
                'active': Business.objects.filter(status='Active').count(),
                'pending': Business.objects.filter(status='Pending').count(),
                'flagged': Business.objects.filter(status='Flagged').count(),
                'total': Business.objects.count(),
            },
            'reviewStats': {
                'total': Review.objects.count(),
                'today': Review.objects.filter(created_at__date=today).count(),
                'flagged': Review.objects.filter(status='Flagged').count(),
            },
            'payoutStats': {
                'pending': pending_payouts,
                'processed': processed_payouts,
            },
            'supportStats': {'newTickets': 0, 'unresolved': 0},
            'userGrowth': user_growth,
            'reviewActivity': review_activity,
        }
        return Response(data)

    elif user.role == 'owner':
        businesses = Business.objects.filter(owner=user)
        data = {
            'businessCount': businesses.count(),
            'reviewCount': Review.objects.filter(business__in=businesses).count(),
            'coins': 0,
        }
        return Response(data)

    return Response({'error': 'Unauthorized role'}, status=403)


# ================================================================
# AI SUGGESTION
# ================================================================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def get_ai_suggestion(request):
    business_name = request.data.get('business_name', 'Business')
    category = request.data.get('category', 'General')
    sentiment = request.data.get('sentiment', 'positive')
    try:
        from .ai_service import generate_review_suggestion
        suggestion = generate_review_suggestion(business_name, category, sentiment)
        return Response({'suggestion': suggestion})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
