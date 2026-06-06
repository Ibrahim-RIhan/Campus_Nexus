# CampusNexus Documentation

## Overview
CampusNexus is a Campus-Centric Rental & Community Services Platform designed for students. The platform allows users (Renters/Borrowers and Lenders/Providers) to list, rent, and manage items securely while providing a community event feature.

## Technology Stack
- **Frontend:** React Tailwind (Component-based UI)
- **Backend:** Node JS
- **Authentication:** JWT
- **Database:** MySQL

## Architectural Design
The architecture relies on  MySQL as the core data store. The system connects a React Frontend to a Node JS backend, handling specific modules: Authentication, Listing/Rental Management, Transactions, and Notifications.

---

## Module-by-Module Breakdown

### 1. User Management Module
Handles all user authentication, authorization, and profile management.
- **Features:**
  - Registration & Login
  - Verify Email
  - Update Profile
  - Role Management (Renter/Borrower, Lender/Provider, Admin)
  - Authentication via JWT
- **Core Entity:** `User` (Attributes: id, name, email, password, role, is_verified, created_at)

### 2. Listing & Item Management Module
Allows providers to post items and renters to discover them.
- **Features:**
  - Post Listing (Create new item)
  - View Listings
  - Search & Filter Items (by query, category, price)
  - Item Details & Status Tracking (condition, availability status)
  - Manage Listings (Update/Delete item)
- **Core Entity:** `Item` (Attributes: id, ownerId, title, category, price, deposit, condition, status, created_at)

### 3. Rental Management Module
The core operational module handling the lifecycle of an item rental.
- **Features:**
  - Cart & Checkout System
  - Availability Calendar (Check if item is available on selected dates)
  - Calculate Cost (including Security Deposit)
  - **Rental Status State Machine:** The rental lifecycle follows a strict flow: 
    - `REQUESTED` → `APPROVED` → `ACTIVE` → `RETURNED` → `COMPLETED`
    - Alternative paths: `REJECTED` or `OVERDUE`
  - Refund Request System
- **Core Entity:** `Rental` (Attributes: id, itemId, renterId, startDate, endDate, totalCost, depositPaid, status, created_at)

### 4. Transaction & Payment Module
Manages the financial records of the rentals and security deposits.
- **Features:**
  - Order / Payment Processing
  - Simulated Payment Flow (To demonstrate database operations without relying on third-party APIs)
  - Security Deposit Management
- **Core Entity:** `Transaction` (Attributes: id, senderId, receiverId, amount, type, created_at)

### 5. Review & Rating Module
Maintains community trust through user feedback.
- **Features:**
  - Submit Review (Comment and 1-5 Rating)
  - Get Average Rating (Calculated per item/provider)
- **Core Entity:** `Review` (Attributes: id, rentalId, reviewerId, rating, comment, created_at)

### 6. Notification System
Keeps users informed about rental statuses and requests.
- **Features:**
  - Database-driven polling (Uses the MySQL Notification table rather than WebSockets/Redis to keep architecture simple yet effective)
  - Notification Triggers (e.g., "Order Requested", "New Rental")
  - Mark Notifications as Read
  - Unread Notification Count
- **Core Entity:** `Notification` (Attributes: id, userId, message, is_read, created_at)

### 7. Event Management Module
Community feature for campus events.
- **Features:**
  - Browse Events
  - Manage Events
- **Core Entity:** `Event` (Attributes: id, title, date, is_verified)

### 8. Admin Operations Module
Provides administrative oversight for platform integrity.
- **Features:**
  - Manage Users (Ban, verify, etc.)
  - Manage Listings (Remove inappropriate listings)
  - Verify / Moderate System Activity
  - Reports & System Logs

---

## Key Workflows

### Rental Status Tracking
1. **Renter Places Order** -> Status: `REQUESTED`
2. **Owner Approves?**
   - **No** -> Status: `REJECTED`
   - **Yes** -> Status: `APPROVED`
3. **Rental Commences** -> Status: `ACTIVE`
4. **Item Returned** -> Status: `RETURNED`
5. **Rental Finalized** -> Status: `COMPLETED`

### Login Workflow
1. User enters email & password.
2. System checks if credentials are valid.
3. If invalid, show error message.
4. If valid, issue JWT token and grant access to the account.
