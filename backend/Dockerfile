# Use PHP 8.4 + Apache (matches Firebase PHP requirement)
FROM php:8.4-apache

# Set working directory
WORKDIR /var/www/html/

# Install system dependencies & PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libgrpc-dev \
    zlib1g-dev \
    libzip-dev \
    && pecl install grpc \
    && docker-php-ext-enable grpc \
    && docker-php-ext-install pdo pdo_mysql

# Enable Apache rewrite for .htaccess routing
RUN a2enmod rewrite

# Set Apache document root to /public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Copy backend code
COPY . /var/www/html/

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Set permissions for Apache
RUN chown -R www-data:www-data /var/www/html

# Expose default HTTP port
EXPOSE 80
