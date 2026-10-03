# HinchMart B2B Marketplace - Backend API Specification

> **Base URL:** `https://api.hinchmart.com/api`  
> **Auth Scheme:** Standard HTTP Bearer Token (`Authorization: Bearer <jwt_token>`)  
> **Standard Success Envelope:** All JSON responses should adhere to `{ "success": true, "statusCode": 200, "message": "...", "data": ... }`.

---

## 1. Authentication & Profile APIs *(Priority 1 - Blocker)*

### 1.1 Send Mobile OTP
- **Endpoint:** `POST /api/auth/send-otp`
- **Auth:** Public
- **Request Body:**
```json
{
  "phone": "9876543210",
  "purpose": "LOGIN"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully to 9876543210",
  "data": {
    "otpCode": "123456",
    "expiresInSeconds": 300
  }
}
```

---

### 1.2 Verify Mobile OTP & Login
- **Endpoint:** `POST /api/auth/verify-otp`
- **Auth:** Public
- **Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```
- **Response (200 OK):** *(Must return standard Bearer JWT)*
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 101,
      "fullName": "Rajesh Sharma",
      "email": "rajesh@infraprojects.com",
      "phone": "9876543210",
      "role": "BUYER",
      "companyName": "Apex Infra Projects Pvt Ltd",
      "gstin": "36AAACA1234A1Z5",
      "isGstVerified": true,
      "creditLimit": 5000000,
      "availableCredit": 4250000
    }
  }
}
```

---

### 1.3 Get Current User Profile
- **Endpoint:** `GET /api/user/profile`
- **Auth:** `Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "fullName": "Rajesh Sharma",
    "email": "rajesh@infraprojects.com",
    "phone": "9876543210",
    "role": "BUYER",
    "companyName": "Apex Infra Projects Pvt Ltd",
    "gstin": "36AAACA1234A1Z5",
    "isGstVerified": true,
    "creditLimit": 5000000,
    "availableCredit": 4250000
  }
}
```

---

### 1.4 Update User Profile
- **Endpoint:** `PUT /api/user/profile`
- **Auth:** `Bearer <token>`
- **Request Body:**
```json
{
  "fullName": "Rajesh Sharma",
  "companyName": "Apex Infra Projects Pvt Ltd",
  "email": "rajesh@infraprojects.com"
}
```

---

## 2. Customer Delivery Addresses (`/api/user/addresses`)

### 2.1 Get Saved Addresses
- **Endpoint:** `GET /api/user/addresses`
- **Auth:** `Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "addressId": 1,
      "contactName": "Site Supervisor Ramesh",
      "mobile": "9876543210",
      "companyName": "Apex Infra Projects Pvt Ltd",
      "gstin": "36AAACA1234A1Z5",
      "addressLine1": "Survey 45, HITEC City Industrial Corridor",
      "city": "Hyderabad",
      "state": "Telangana",
      "pincode": "500081",
      "addressType": "Site / Project",
      "isDefaultDelivery": true,
      "isDefaultBilling": false
    }
  ]
}
```

---

### 2.2 Add New Site Address
- **Endpoint:** `POST /api/user/addresses`
- **Auth:** `Bearer <token>`
- **Request Body:**
```json
{
  "contactName": "Site Engineer Kumar",
  "mobile": "9876543210",
  "companyName": "Apex Infra Projects Pvt Ltd",
  "gstin": "36AAACA1234A1Z5",
  "addressLine1": "Plot 12, Gachibowli Phase 2",
  "city": "Hyderabad",
  "state": "Telangana",
  "pincode": "500081",
  "addressType": "Site / Project",
  "isDefaultDelivery": true,
  "isDefaultBilling": false
}
```

---

## 3. Cart Management APIs (`/api/cart`)

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/cart` | `GET` | `Bearer <token>` | Retrieve current user's cart items, subtotal, and tax totals. |
| `/api/cart/items` | `POST` | `Bearer <token>` | Add product to cart (`{ productId, quantity }`). |
| `/api/cart/items/{productId}` | `PUT` | `Bearer <token>` | **Set exact quantity** (`{ quantity: 38 }`). |
| `/api/cart/items/{productId}` | `DELETE` | `Bearer <token>` | Remove product SKU from cart. |
| `/api/cart` | `DELETE` | `Bearer <token>` | Empty entire cart. |
| `/api/cart/coupon` | `POST` | `Bearer <token>` | Apply coupon code (`{ couponCode: "BUILD10" }`). |

- **Standard Cart Response Format (200 OK):**
```json
{
  "success": true,
  "data": {
    "cartId": 1,
    "items": [
      {
        "productId": 20,
        "productName": "Solimo 8-Piece Gardening Tool Kit",
        "pricePerUnit": 569,
        "quantity": 38,
        "totalPrice": 21622,
        "gstRate": 18
      }
    ],
    "subtotal": 21622,
    "gstTotal": 3892,
    "deliveryTotal": 0,
    "discountTotal": 0,
    "grandTotal": 25514
  }
}
```

---

## 4. Procurement Orders & Invoices (`/api/orders`)

### 4.1 Authorize & Place Purchase Order
- **Endpoint:** `POST /api/orders`
- **Auth:** `Bearer <token>`
- **Request Body:**
```json
{
  "addressId": 1,
  "paymentMethod": "RAZORPAY",
  "deliverySlot": "Morning (08:00 - 12:00)",
  "deliveryInstructions": "Heavy vehicle trailer access required.",
  "poNumber": "PO-APEX-2026-001",
  "requiresCraneUnloading": true
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "orderId": 5057,
    "orderNumber": "HNCH-2026-5057",
    "poNumber": "PO-APEX-2026-001",
    "status": "ORDER_CONFIRMED",
    "paymentStatus": "PAID",
    "subtotal": 21622,
    "taxTotal": 3892,
    "deliveryCharge": 0,
    "grandTotal": 25514,
    "invoiceId": "INV-HNCH-2026-5057",
    "ewayBillNumber": "241098327192"
  }
}
```

---

### 4.2 Other Order Sub-Endpoints

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/orders` | `GET` | `Bearer <token>` | Get buyer order history. |
| `/api/orders/{id}` | `GET` | `Bearer <token>` | Get order details by order ID or order number. |
| `/api/orders/{id}/tracking` | `GET` | `Bearer <token>` | Heavy vehicle live GPS telematics, driver name & LR number. |
| `/api/orders/{id}/invoice` | `GET` | `Bearer <token>` | Generate official GST Tax Invoice data object. |
| `/api/orders/{id}/cancel` | `POST` | `Bearer <token>` | Pre-dispatch cancellation request (`{ reason: "..." }`). |
| `/api/orders/{id}/mtc` | `GET` | `Bearer <token>` | Fetch official Mill Test Certificate document URL. |
| `/api/invoices/{orderId}/download-pdf` | `GET` | `Bearer <token>` | Download pre-rendered Tax Invoice PDF (stream blob). |

---

## 5. RFQ (Request For Quote) & Supplier Quotes

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `POST /api/rfqs` | `POST` | Submit bulk RFQ: `{ categoryId, quantity, unit, targetPrice, deliveryPincode, deadlineDate, documents: [] }` |
| `GET /api/rfqs` | `GET` | Get all RFQs submitted by the buyer. |
| `GET /api/rfqs/{id}` | `GET` | Get RFQ details and requirements. |
| `GET /api/rfqs/{rfqId}/quotes` | `GET` | Get supplier quotation bids submitted for this RFQ. |
| `POST /api/rfqs/quotes/{quoteId}/accept` | `POST` | Accept winning quote and convert to purchase order. |
| `POST /api/rfqs/quotes/{quoteId}/reject` | `POST` | Reject quotation bid with optional reason. |
| `POST /api/rfqs/quotes/{quoteId}/counter` | `POST` | Submit counter-offer unit price to supplier. |

---

## 6. Document & Media Upload (`/api/upload`)
- **Endpoint:** `POST /api/upload` (alias: `/api/documents/upload`)
- **Auth:** `Bearer <token>`
- **Content-Type:** `multipart/form-data`
- **Request Form:**
  - `file`: Binary file (PDF, PNG, JPG up to 15MB)
  - `folder`: `"kyc"` | `"rfq"` | `"mtc"` | `"products"`
- **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "File uploaded successfully",
  "url": "https://hinchmart-storage.../kyc/filename.pdf"
}
```

---

## 7. B2B Credit Line / PayLater (`/api/credit`)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `POST /api/credit/apply` | `POST` | Apply for 30/60 day credit: `{ companyGstin, annualTurnover, requestedLimit, bankStatementUrl }` |
| `GET /api/credit/ledger` | `GET` | Get approved credit limit, available limit, due amount, statement transactions. |

---

## 8. In-App Notifications & Real-Time Chat

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /api/notifications` | `GET` | Get user notifications (order dispatch, RFQ quotes, invoices). |
| `PUT /api/notifications/{id}/read` | `PUT` | Mark single notification as read. |
| `PUT /api/notifications/read-all` | `PUT` | Mark all notifications as read. |

---

## 9. Delivery & Site Address Management (`/api/user/addresses`)

### 9.1 Get Saved Addresses
- **Endpoint:** `GET /api/user/addresses` (alias: `GET /api/addresses`)
- **Auth:** `Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "addressId": 1,
      "siteName": "Apex Infra Projects",
      "recipientName": "Site Supervisor Ramesh",
      "phone": "9876543210",
      "addressLine1": "Survey 45, HITEC City Industrial Corridor",
      "city": "Hyderabad",
      "state": "Telangana",
      "country": "India",
      "pincode": "500081",
      "addressType": "WORK",
      "isDefault": true,
      "hasHeavyVehicleAccess": true,
      "createdAt": "2026-09-30T10:00:00"
    }
  ]
}
```

### 9.2 Add New Delivery Address
- **Endpoint:** `POST /api/user/addresses` (alias: `POST /api/addresses`)
- **Auth:** `Bearer <token>`
- **Request Body (`AddressRequest.java`):**
```json
{
  "recipientName": "Site Supervisor Ramesh",
  "phone": "9876543210",
  "siteName": "Apex Infra Projects",
  "addressLine1": "Survey 45, HITEC City Industrial Corridor",
  "city": "Hyderabad",
  "state": "Telangana",
  "country": "India",
  "pincode": "500081",
  "addressType": "WORK",
  "isDefault": true,
  "hasHeavyVehicleAccess": true
}
```
*Note on Validation:*
- `addressType`: Pattern `^(?i)(HOME|WORK|OTHER)$` (e.g. `WORK`, `HOME`, `OTHER`).
- `pincode`: 6-digit regex `^[1-9][0-9]{5}$`.
- `phone`: 7–20 digits.

---

## 10. Cart Management APIs (`/api/cart`)

| Endpoint | Method | Auth | Request Body | Description |
| :--- | :---: | :---: | :--- | :--- |
| `GET /api/cart` | `GET` | `Bearer <token>` | *None* | Retrieves active cart with items, GST breakdown, tier savings, and grand total. |
| `POST /api/cart/items` | `POST` | `Bearer <token>` | `{"productId": 20, "quantity": 38}` | Adds or increments product quantity in cart. |
| `PUT /api/cart/items/{id}` | `PUT` | `Bearer <token>` | `{"quantity": 38}` | Sets exact quantity. `{id}` accepts `productId` or `cartItemId`. Quantity 0 removes item. |
| `DELETE /api/cart/items/{id}` | `DELETE` | `Bearer <token>` | *None* | Removes item from cart. `{id}` accepts `productId` or `cartItemId`. |
| `DELETE /api/cart` | `DELETE` | `Bearer <token>` | *None* | Clears all items and resets coupon. |
| `POST /api/cart/coupon` | `POST` | `Bearer <token>` | `{"code": "BUILD10"}` | Validates and applies promotional/corporate coupon code. |
| `DELETE /api/cart/coupon` | `DELETE` | `Bearer <token>` | *None* | Removes applied coupon from cart. |

### 10.1 Cart Response Schema
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart retrieved successfully",
  "data": {
    "cartId": 1,
    "storeId": 10,
    "storeName": "Apex Infra Supplies",
    "storeSlug": "apex-infra-supplies",
    "items": [
      {
        "cartItemId": 105,
        "productId": 20,
        "title": "Solimo 8-Piece Gardening Tool Kit",
        "imageUrl": "https://cdn.hinchmart.com/products/solimo-gardening.jpg",
        "quantity": 38,
        "unit": "Pcs",
        "unitPrice": 569.00,
        "originalPrice": 620.00,
        "appliedTier": "20+ Pcs Wholesale Tier (-₹51/Pcs)",
        "gstRate": 18.0,
        "lineTotal": 21622.00,
        "lineGst": 3891.96
      }
    ],
    "subtotal": 21622.00,
    "couponDiscount": 0.00,
    "totalGst": 3891.96,
    "deliveryCharge": 0.00,
    "grandTotal": 25513.96,
    "appliedCoupon": null
  }
}
```

---

## 11. Messaging & Vendor Inquiries (`/api/conversations`)

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `GET /api/conversations` | `GET` | `Bearer <token>` | Get buyer-vendor messaging threads. |
| `POST /api/conversations/send` | `POST` | `Bearer <token>` | Send message: `{ sellerId, topic, subject, message, referenceId }`. |

