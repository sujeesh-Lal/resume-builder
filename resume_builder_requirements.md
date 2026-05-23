# Resume Builder Platform -- Requirements & Phased Development Plan

## Product Goal

Build a Resume Builder SaaS platform using: - React - NestJS
microservices - MongoDB - Event-driven architecture - Guest users
initially - Authentication later - Payment support later - Scalable
monorepo design

------------------------------------------------------------------------

# Phase 0 --- Foundation & Architecture Setup

## Repository Structure

``` txt
resume-platform/

apps/
   web-app
   gateway
   auth-service
   resume-service
   pdf-service

libs/
   shared-types
   events
   logger
   common
```

## Tech Stack

Frontend: - React - TypeScript - Tailwind - Zustand - React Hook Form -
DnD Kit

Backend: - NestJS - MongoDB - Redis - RabbitMQ - Docker

Deliverables: - Monorepo setup - API gateway - Shared libraries - Docker
setup

------------------------------------------------------------------------

# Phase 1 --- MVP

Goal: Create resume without login.

Features: - Guest users - Resume creation wizard - Personal info -
Summary - Experience - Education - Skills - Projects - Certifications -
Dynamic sections - Live preview - PDF generation via Puppeteer - Local
storage persistence - Multiple templates

Events: - RESUME_CREATED - RESUME_UPDATED - PDF_REQUESTED -
PDF_GENERATED

Services: - Gateway - Resume Service - PDF Service

------------------------------------------------------------------------

# Phase 2 --- Authentication

Features: - Email login - Google login - JWT - Refresh tokens - Forgot
password - Guest resume migration - User dashboard - Resume history

Events: - USER_CREATED - USER_LOGGED_IN - GUEST_CONVERTED

------------------------------------------------------------------------

# Phase 3 --- Advanced Resume Features

Features: - Drag and drop ordering - Additional resume sections - Theme
customization - Fonts - Resume sharing links - Password-protected
resumes - QR code in PDF

------------------------------------------------------------------------

# Phase 4 --- AI Features

Features: - Resume enhancement - ATS score - Job description matching -
Resume rewriting

Events: - AI_ANALYSIS_REQUESTED

------------------------------------------------------------------------

# Phase 5 --- Resume Import

Features: - Upload PDF - Upload DOCX - Parse existing resumes

Events: - RESUME_IMPORT_REQUESTED

------------------------------------------------------------------------

# Phase 6 --- Notifications

Features: - Email notifications - PDF completion notification - Welcome
email

Events: - PDF_GENERATED - PAYMENT_COMPLETED

------------------------------------------------------------------------

# Phase 7 --- Payments

Features: - Subscription plans - Premium templates - AI credits -
Payment history - Coupons

Events: - PAYMENT_COMPLETED - SUBSCRIPTION_CREATED

------------------------------------------------------------------------

# Phase 8 --- Analytics

Features: - Resume views - Download counts - Profile visits

------------------------------------------------------------------------

# Infrastructure

Containers: - gateway - auth-service - resume-service - pdf-service -
payment-service - ai-service - notification-service - web-app

Storage: - MongoDB - Redis - RabbitMQ - S3

Deployment: - Docker - Kubernetes later

------------------------------------------------------------------------

# Future Repository Split

Start with:

-   Single monorepo

Later:

-   frontend-repo
-   backend-services-repo
-   infrastructure-repo
