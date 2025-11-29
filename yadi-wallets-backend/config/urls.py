
from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static

from users.views import GoogleLogin

print("=" * 50)
print("CONFIG URLS LOADING")
print("=" * 50)

urlpatterns = [
    path('admin/', admin.site.urls),
    # 1. Standard Login/Logout/Password Reset
    path('api/auth/', include('dj_rest_auth.urls')),
    
    # 2. Registration (Email)
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # 3. Google Login
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),

    
    path('api/service/', include('integrations.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/users/', include('users.urls')),
]


print("Main URL patterns:", [str(p.pattern) for p in urlpatterns])
print("=" * 50)



if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
