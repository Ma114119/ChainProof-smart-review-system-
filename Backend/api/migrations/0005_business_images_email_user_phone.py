from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_systemsettings_customuser_profile_picture_and_more'),
    ]

    operations = [
        # Add phone to CustomUser
        migrations.AddField(
            model_name='customuser',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        # Add email to Business
        migrations.AddField(
            model_name='business',
            name='email',
            field=models.EmailField(blank=True, default='', max_length=254),
        ),
        # Add profile_picture to Business
        migrations.AddField(
            model_name='business',
            name='profile_picture',
            field=models.ImageField(blank=True, null=True, upload_to='business_pictures/'),
        ),
        # Add cover_image to Business
        migrations.AddField(
            model_name='business',
            name='cover_image',
            field=models.ImageField(blank=True, null=True, upload_to='business_covers/'),
        ),
        # Add gallery images to Business
        migrations.AddField(
            model_name='business',
            name='gallery_image_1',
            field=models.ImageField(blank=True, null=True, upload_to='business_gallery/'),
        ),
        migrations.AddField(
            model_name='business',
            name='gallery_image_2',
            field=models.ImageField(blank=True, null=True, upload_to='business_gallery/'),
        ),
        migrations.AddField(
            model_name='business',
            name='gallery_image_3',
            field=models.ImageField(blank=True, null=True, upload_to='business_gallery/'),
        ),
        migrations.AddField(
            model_name='business',
            name='gallery_image_4',
            field=models.ImageField(blank=True, null=True, upload_to='business_gallery/'),
        ),
    ]
