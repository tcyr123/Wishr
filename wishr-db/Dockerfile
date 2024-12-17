FROM postgres:latest

# Install cron
RUN apt-get update && apt-get install -y cron

COPY start.sh /start.sh
COPY init.sql /docker-entrypoint-initdb.d/
COPY backup-restore.sh /backup-restore.sh
RUN chmod +x /backup-restore.sh

# Add a cron file
COPY backup-cron /etc/cron.d/backup-cron
RUN chmod 0644 /etc/cron.d/backup-cron
RUN crontab /etc/cron.d/backup-cron

CMD /start.sh