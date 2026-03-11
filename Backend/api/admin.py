from django.contrib import admin
from .models import CustomUser, Business, Review, Bookmark, SystemSettings, OwnerCoinPurchaseRequest, CustomerPayoutRequest, WalletCredit

admin.site.register(CustomUser)
admin.site.register(Business)
admin.site.register(Review)
admin.site.register(Bookmark)
admin.site.register(SystemSettings)
admin.site.register(OwnerCoinPurchaseRequest)
admin.site.register(CustomerPayoutRequest)
admin.site.register(WalletCredit)
