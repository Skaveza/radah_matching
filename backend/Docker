# Use official PHP + Apache image
FROM php:8.2-apache

# Install PHP extensions if needed (adjust depending on your app)
RUN docker-php-ext-install pdo pdo_mysql

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

# Expose default HTTP port
EXPOSE 80

# Start Apache (default CMD is fine)
