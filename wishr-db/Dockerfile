FROM postgres:latest

ENV POSTGRES_DB=wishr
ENV POSTGRES_USER=apiuser
ENV POSTGRES_PASSWORD=grespost

COPY init.sql /docker-entrypoint-initdb.d/
