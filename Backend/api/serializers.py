from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, Business, Review, Bookmark


# --- Custom JWT Serializer: enables email login + returns role in response ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get('username', '')
        try:
            user = CustomUser.objects.get(email=email)
            attrs['username'] = user.username
        except CustomUser.DoesNotExist:
            pass
        data = super().validate(attrs)
        # Django superusers always get 'admin' role regardless of DB role field
        data['role'] = 'admin' if (self.user.is_superuser or self.user.role == 'admin') else self.user.role
        data['user_id'] = self.user.id
        data['username'] = self.user.username
        data['email'] = self.user.email
        return data


# --- User Registration Serializer ---
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'cnic', 'wallet_address', 'full_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'read_only': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        first_name = full_name.split(' ')[0]
        last_name = ' '.join(full_name.split(' ')[1:]) if ' ' in full_name else ''

        email = validated_data['email']
        username = email.split('@')[0]

        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{email.split('@')[0]}{counter}"
            counter += 1

        user = CustomUser.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            role=validated_data.get('role', 'customer'),
            cnic=validated_data.get('cnic', None),
            wallet_address=validated_data.get('wallet_address', None)
        )
        return user


# --- Admin User Management Serializer ---
class UserDetailSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'display_name', 'role', 'is_active', 'status',
            'date_joined', 'wallet_address', 'cnic', 'profile_picture_url'
        ]
        read_only_fields = ['id', 'username', 'email', 'date_joined', 'display_name', 'status', 'profile_picture_url']

    def get_display_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_status(self, obj):
        return 'Active' if obj.is_active else 'Suspended'

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


# --- Business Serializer ---
class BusinessSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    owner_id = serializers.ReadOnlyField(source='owner.id')
    owner_email = serializers.ReadOnlyField(source='owner.email')
    avg_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    gallery_image_urls = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            'id', 'owner', 'owner_id', 'owner_email', 'name', 'description', 'category',
            'address', 'phone_number', 'email', 'website_url', 'establishment_year',
            'status', 'created_at', 'avg_rating', 'total_reviews',
            'profile_picture', 'cover_image',
            'gallery_image_1', 'gallery_image_2', 'gallery_image_3', 'gallery_image_4',
            'profile_picture_url', 'cover_image_url', 'gallery_image_urls',
        ]
        extra_kwargs = {
            'profile_picture': {'required': False, 'write_only': True},
            'cover_image': {'required': False, 'write_only': True},
            'gallery_image_1': {'required': False, 'write_only': True},
            'gallery_image_2': {'required': False, 'write_only': True},
            'gallery_image_3': {'required': False, 'write_only': True},
            'gallery_image_4': {'required': False, 'write_only': True},
        }

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return 0

    def get_total_reviews(self, obj):
        return obj.reviews.count()

    def _build_url(self, obj, field_name):
        field = getattr(obj, field_name, None)
        if field:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(field.url)
            return field.url
        return None

    def get_profile_picture_url(self, obj):
        return self._build_url(obj, 'profile_picture')

    def get_cover_image_url(self, obj):
        return self._build_url(obj, 'cover_image')

    def get_gallery_image_urls(self, obj):
        urls = []
        for i in range(1, 5):
            url = self._build_url(obj, f'gallery_image_{i}')
            if url:
                urls.append(url)
        return urls


# --- My Profile Serializer (authenticated user updating own profile) ---
class ProfileSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'display_name', 'wallet_address', 'cnic', 'role', 'phone',
            'profile_picture', 'profile_picture_url', 'wallet_connected_once',
        ]
        read_only_fields = ['id', 'email', 'role', 'profile_picture_url']
        extra_kwargs = {
            'profile_picture': {'required': False},
            'phone': {'required': False},
        }

    def get_display_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.username = validated_data.get('username', instance.username)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.wallet_address = validated_data.get('wallet_address', instance.wallet_address)
        if 'wallet_address' in validated_data and validated_data['wallet_address']:
            instance.wallet_connected_once = True
        # When disconnecting (wallet_address=None), we NEVER clear wallet_connected_once
        if 'profile_picture' in validated_data:
            instance.profile_picture = validated_data['profile_picture']
        instance.save()
        return instance


# --- Change Password Serializer ---
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'New passwords do not match.'})
        validate_password(data['new_password'])
        return data

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


# --- Bookmark Serializer ---
class BookmarkSerializer(serializers.ModelSerializer):
    business_id = serializers.ReadOnlyField(source='business.id')
    business_name = serializers.ReadOnlyField(source='business.name')
    business_category = serializers.ReadOnlyField(source='business.category')
    business_address = serializers.ReadOnlyField(source='business.address')
    avg_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Bookmark
        fields = ['id', 'business_id', 'business_name', 'business_category', 'business_address', 'avg_rating', 'total_reviews', 'created_at']

    def get_avg_rating(self, obj):
        reviews = obj.business.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return 0

    def get_total_reviews(self, obj):
        return obj.business.reviews.count()


# --- Review Serializer ---
class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    business_name = serializers.ReadOnlyField(source='business.name')
    user_profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'business', 'business_name', 'rating', 'content',
            'status', 'created_at', 'blockchain_hash', 'transaction_id', 'is_rewarded',
            'user_profile_picture_url',
        ]
        extra_kwargs = {
            'business': {'write_only': True, 'required': False}
        }

    def get_user_profile_picture_url(self, obj):
        if obj.user.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_picture.url)
            return obj.user.profile_picture.url
        return None
