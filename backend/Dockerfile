FROM php:8.4-apache

WORKDIR /var/www/html/

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libgrpc-dev \
    zlib1g-dev \
    libzip-dev \
    && pecl install grpc \
    && docker-php-ext-enable grpc \
    && docker-php-ext-install pdo pdo_mysql

RUN a2enmod rewrite

# Correct DocumentRoot
RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf
RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/apache2.conf

COPY . /var/www/html/

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
