FROM php:8.4-apache
WORKDIR /var/www/html/

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zlib1g-dev \
    libzip-dev \
    libgrpc-dev \
    && docker-php-ext-install pdo pdo_mysql zip \
    && pecl install grpc \
    && docker-php-ext-enable grpc

RUN a2enmod rewrite

RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf
RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/apache2.conf

# Increase stack size to prevent Firestore gRPC recursion overflow
RUN echo "zend.max_allowed_stack_size=256M" >> /usr/local/etc/php/conf.d/zend-stack.ini
RUN echo "zend.reserved_stack_size=32M" >> /usr/local/etc/php/conf.d/zend-stack.ini

COPY . /var/www/html/
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80