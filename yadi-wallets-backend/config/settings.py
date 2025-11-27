from pathlib import Path
from decouple import config
from django.conf import settings 
from django.conf.urls.static import static

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY: Keep secret in .env
SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-prod')
DEBUG = config('DEBUG', default=True, cast=bool)

# SECURITY: Strict Hosts
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'wallet.yadi.app']


CORS_ALLOW_CREDENTIALS = True

# --- INSTALLED APPS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_daraja',

    # Auth & Social
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',

    # Modular Local Apps
    'users',
    'finance',
    'integrations',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- DATABASE  ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tikitaka_engine_7rb_core',
        'USER': 'offside_master_7x',      
        'PASSWORD': 'R3dCard!Vortex#981',  
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# --- AUTHENTICATION ---
AUTH_USER_MODEL = 'users.User'

# --- CORS (Allow Tickets App to talk to us) ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Local Tickets Frontend
    "http://localhost:8000",  # Local Tickets Backend
    "https://yadi.app",       # Prod Tickets Frontend
    "https://api.yadi.app", 
      "http://localhost:5174",  # Prod Tickets Backend
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:5174", 
    "http://127.0.0.1:5174", 
    "https://yadi.app",
    "https://api.yadi.app",
]


SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  
CSRF_COOKIE_SECURE = False


CSRF_COOKIE_HTTPONLY = False




# --- REST FRAMEWORK ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'integrations.authentication.ServiceKeyAuthentication', 
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# --- STATIC & MEDIA ---
STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'




# --- AUTHENTICATION CONFIG ---
SITE_ID = 1 


AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]


# JWT Settings (Secure HttpOnly Cookies)
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'yadi-wallet-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'yadi-wallet-refresh',
    # Use our custom serializer to return User details on login
    'USER_DETAILS_SERIALIZER': 'users.serializers.UserProfileSerializer',
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# Google Config
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': config('GOOGLE_CLIENT_ID', default=''),
            'secret': config('GOOGLE_CLIENT_SECRET', default=''),
            'key': ''
        },
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'}
    }
}


SOCIALACCOUNT_ADAPTER = 'users.adapters.WalletSocialAdapter'