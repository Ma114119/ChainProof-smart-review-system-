from django.db import models
from django.contrib.auth.models import AbstractUser

# --- User Model ---
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('owner', 'Owner'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    cnic = models.CharField(max_length=15, unique=True, null=True, blank=True)
    wallet_address = models.CharField(max_length=42, null=True, blank=True)  # No unique for FYP demo; same wallet can be used by multiple accounts
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    wallet_connected_once = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, default='')
    bonus_coins = models.IntegerField(default=0)  # Admin-credited coins for testing/demos


# --- System Settings (admin wallet, rates, etc.) ---
class SystemSettings(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True)

    def __str__(self):
        return self.key

    @classmethod
    def get(cls, key, default=''):
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default

    @classmethod
    def set(cls, key, value):
        obj, _ = cls.objects.get_or_create(key=key)
        obj.value = value
        obj.save()
        return obj

# --- Business Model ---
class Business(models.Model):
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='businesses')
    name = models.CharField(max_length=150)
    description = models.TextField()
    category = models.CharField(max_length=50)
    address = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(max_length=254, blank=True, default='')
    website_url = models.URLField(max_length=200, blank=True)
    establishment_year = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Business wallet to pay for review rewards
    business_wallet = models.CharField(max_length=42, null=True, blank=True)

    # Business images
    profile_picture = models.ImageField(upload_to='business_pictures/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='business_covers/', null=True, blank=True)
    gallery_image_1 = models.ImageField(upload_to='business_gallery/', null=True, blank=True)
    gallery_image_2 = models.ImageField(upload_to='business_gallery/', null=True, blank=True)
    gallery_image_3 = models.ImageField(upload_to='business_gallery/', null=True, blank=True)
    gallery_image_4 = models.ImageField(upload_to='business_gallery/', null=True, blank=True)
    
    def __str__(self):
        return self.name
    
# --- Review Model ---
class Review(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    content = models.TextField()
    status = models.CharField(max_length=20, default='Approved')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # BLOCKCHAIN TRACKING FIELDS
    # Stores the Keccak-256 hash of the review
    blockchain_hash = models.CharField(max_length=66, null=True, blank=True)
    # Stores the transaction ID for the ledger entry
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    # Track if the 1 SRT reward has been successfully sent
    is_rewarded = models.BooleanField(default=False)
    
    def __str__(self):
        return f'Review by {self.user.username} for {self.business.name}'


# --- Bookmark Model ---
class Bookmark(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bookmarks')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'business')

    def __str__(self):
        return f'{self.user.username} bookmarked {self.business.name}'


# --- Owner Coin Purchase Request (owner buys coins from admin) ---
class OwnerCoinPurchaseRequest(models.Model):
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='coin_purchase_requests')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='coin_purchase_requests', null=True, blank=True)
    coins_requested = models.IntegerField()
    amount_paid_pkr = models.DecimalField(max_digits=12, decimal_places=2)
    wallet_address = models.CharField(max_length=42)
    # Owner's payment details for reversals
    payment_method = models.CharField(max_length=50, blank=True)  # JazzCash, EasyPaisa, Bank, etc.
    provider_name = models.CharField(max_length=100, blank=True)
    account_title = models.CharField(max_length=150, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    payment_proof_image = models.ImageField(upload_to='payment_proofs/', null=True, blank=True)  # Screenshot of EasyPaisa/bank statement
    status = models.CharField(max_length=20, default='Pending')  # Pending, Completed, Rejected
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.owner.username} → {self.coins_requested} RTC'


# --- Wallet Credit (tracks coins sent to a wallet by admin) ---
class WalletCredit(models.Model):
    wallet_address = models.CharField(max_length=42, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    source = models.CharField(max_length=50, default='transfer')  # 'transfer' or 'purchase'
    reference_id = models.IntegerField(null=True, blank=True)  # OwnerCoinPurchaseRequest.id if source=purchase
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.amount} RTC → {self.wallet_address[:10]}...'


# --- Customer Payout Request (customer sells coins to admin) ---
class CustomerPayoutRequest(models.Model):
    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='payout_requests')
    coins_to_sell = models.IntegerField()
    # Customer's payment details for receiving payout
    payment_method = models.CharField(max_length=50, blank=True)  # JazzCash, EasyPaisa, Bank, etc.
    provider_name = models.CharField(max_length=100, blank=True)
    account_title = models.CharField(max_length=150, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, default='Pending')  # Pending, Completed, Rejected
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.customer.username} sells {self.coins_to_sell} RTC'


# --- Support Messages (in-system messaging between customers/owners and admin) ---
class SupportThread(models.Model):
    """One thread per user (customer or owner) for support with admin."""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='support_thread')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Support thread: {self.user.username}'


class SupportMessage(models.Model):
    """Individual message in a support thread."""
    thread = models.ForeignKey(SupportThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_support_messages')
    message = models.TextField()
    attachment = models.FileField(upload_to='support_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.sender.username}: {self.message[:30]}...'


# --- Contact Form Submission (from Contact Us page, visible to admin in Inbox) ---
class ContactSubmission(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField(max_length=254)
    subject = models.CharField(max_length=100)  # General Inquiry, Technical Support, etc.
    message = models.TextField()
    attachment = models.FileField(upload_to='contact_attachments/', null=True, blank=True)
    status = models.CharField(max_length=20, default='Open')  # Open, Resolved
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} - {self.subject} ({self.created_at.date()})'