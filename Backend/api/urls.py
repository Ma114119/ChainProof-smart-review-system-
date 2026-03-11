from django.urls import path
from .views import (
    RegisterView, LoginView, ProfileView,
    BusinessView, BusinessDetailView,
    ReviewView, my_reviews,
    PublicBusinessListView, PublicBusinessDetailView,
    AdminUserListView, AdminUserDetailView,
    AdminReviewListView, AdminReviewDetailView,
    get_ai_suggestion, get_stats,
    change_password, delete_account, my_bookmarks, add_bookmark, remove_bookmark,
    get_admin_wallet, set_admin_wallet,
    transfer_business_ownership,
    get_financials, update_exchange_rate, admin_transfer_coins,
    get_admin_payment_details, save_admin_payment_details,
    owner_request_buy_coins, get_owner_wallet_balance, get_owner_transactions, customer_request_sell_coins,
    admin_get_purchase_requests, admin_get_payout_requests,
    admin_complete_purchase_request, admin_complete_payout_request,
    admin_reject_payout_request,
    submit_contact_form, admin_get_contact_submissions, admin_update_contact_submission,
    get_my_support_messages, send_support_message, get_unread_support_count,
    admin_get_support_threads, admin_get_thread_messages, admin_reply_support,
    get_customer_balance, admin_credit_customer_coins,
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('me/change-password/', change_password, name='change-password'),
    path('me/delete/', delete_account, name='delete-account'),

    # Public (no auth required)
    path('public/businesses/', PublicBusinessListView.as_view(), name='public-business-list'),
    path('public/businesses/<int:pk>/', PublicBusinessDetailView.as_view(), name='public-business-detail'),

    # Businesses (owner-scoped; admin sees all via GET /businesses/)
    path('businesses/', BusinessView.as_view(), name='business-list-create'),
    path('businesses/<int:pk>/', BusinessDetailView.as_view(), name='business-detail'),
    path('businesses/<int:business_id>/reviews/', ReviewView.as_view(), name='review-list-create'),

    # Customer
    path('my-reviews/', my_reviews, name='my-reviews'),
    path('customer/balance/', get_customer_balance, name='customer-balance'),
    path('admin/credit-customer-coins/<int:user_id>/', admin_credit_customer_coins, name='admin-credit-customer-coins'),

    # Bookmarks
    path('bookmarks/', my_bookmarks, name='my-bookmarks'),
    path('bookmarks/<int:business_id>/', add_bookmark, name='add-bookmark'),
    path('bookmarks/<int:business_id>/remove/', remove_bookmark, name='remove-bookmark'),

    # Admin: user management
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),

    # Admin: review moderation
    path('admin/reviews/', AdminReviewListView.as_view(), name='admin-reviews'),
    path('admin/reviews/<int:pk>/', AdminReviewDetailView.as_view(), name='admin-review-detail'),

    # Admin: transfer business ownership
    path('admin/businesses/<int:business_id>/transfer-owner/', transfer_business_ownership, name='transfer-business-owner'),

    # Admin wallet
    path('admin-wallet/', get_admin_wallet, name='get-admin-wallet'),
    path('admin-wallet/set/', set_admin_wallet, name='set-admin-wallet'),
    # Admin financials
    path('admin/financials/', get_financials, name='get-financials'),
    path('admin/financials/rate/', update_exchange_rate, name='update-exchange-rate'),
    path('admin/financials/transfer/', admin_transfer_coins, name='admin-transfer-coins'),
    path('admin/payment-details/', get_admin_payment_details, name='get-admin-payment-details'),
    path('admin/payment-details/save/', save_admin_payment_details, name='save-admin-payment-details'),
    path('owner/buy-coins/', owner_request_buy_coins, name='owner-buy-coins'),
    path('owner/wallet-balance/', get_owner_wallet_balance, name='owner-wallet-balance'),
    path('owner/transactions/', get_owner_transactions, name='owner-transactions'),
    path('customer/sell-coins/', customer_request_sell_coins, name='customer-sell-coins'),
    path('admin/purchase-requests/', admin_get_purchase_requests, name='admin-purchase-requests'),
    path('admin/payout-requests/', admin_get_payout_requests, name='admin-payout-requests'),
    path('admin/purchase-requests/<int:pk>/complete/', admin_complete_purchase_request, name='admin-complete-purchase'),
    path('admin/payout-requests/<int:pk>/complete/', admin_complete_payout_request, name='admin-complete-payout'),
    path('admin/payout-requests/<int:pk>/reject/', admin_reject_payout_request, name='admin-reject-payout'),
    path('admin/contact-submissions/', admin_get_contact_submissions, name='admin-contact-submissions'),
    path('admin/contact-submissions/<int:pk>/', admin_update_contact_submission, name='admin-update-contact-submission'),

    # Contact form (public)
    path('contact/', submit_contact_form, name='submit-contact'),

    # Support messages (customer/owner <-> admin)
    path('support/messages/', get_my_support_messages, name='support-messages'),
    path('support/send/', send_support_message, name='support-send'),
    path('support/unread-count/', get_unread_support_count, name='support-unread-count'),
    path('admin/support-threads/', admin_get_support_threads, name='admin-support-threads'),
    path('admin/support-threads/<int:thread_id>/messages/', admin_get_thread_messages, name='admin-thread-messages'),
    path('admin/support-threads/<int:thread_id>/reply/', admin_reply_support, name='admin-support-reply'),

    # Shared
    path('ai/suggest/', get_ai_suggestion, name='ai_suggestion'),
    path('stats/', get_stats, name='stats'),
]
