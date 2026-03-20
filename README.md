# SUDO_SHUTDOWN-DEVTRAILS
Team: Sudo Shutdown


### Lastmile — an AI-Powered Parametric Income Protection for Quick-Commerce Riders

Lastmile is a mobile-first parametric insurance platform that protects quick-commerce delivery riders from income loss caused by verified external disruptions.

### Problem Statement:  
Quick-commerce delivery riders are an essential part of urban delivery ecosystem. Their earnings depend on continuous order flow, active working hours, and access to operational delivery zones. 
However, external disruptions such as heavy rain, flooding, waterlogging, severe AQI, heatwaves, dark-store shutdowns, and platform outages can sharply reduce their ability to work and earn.

These disruptions are outside the rider’s control, yet they directly impact short-term income. 
Existing insurance systems do not address this specific problem well, because they are generally designed around health, life, accident, or asset protection rather than real-time, disruption-linked income loss.

This creates a gap in protection for gig workers whose income is volatile, weekly in nature, and highly sensitive to external operating conditions.


## Persona Selection

1) What is our chosen persona?:  
Our chosen persona is quick-commerce delivery riders working with platforms like Blinkit, Zepto, and Swiggy Instamart.

2) Why did we choose this persona?:  
We chose this group because they seem like the best fit for the kind of product we want to build.
Their work is very time-sensitive and depends on constant order flow within a small delivery area.
If something goes wrong in that area, like heavy rain, flooding, bad AQI, a dark store shutting down, or even a platform issue, their earnings can drop almost immediately.
That makes this problem much easier to identify, measure, and solve through a weekly income-protection model.

3) What is the estimated user base?:  
Exact rider-only numbers are not always publicly available. But the overall scale of the quick-commerce workforce is already very large.
ET Retail reported in November 2024, citing TeamLease Services, that Blinkit, Zepto, and Swiggy Instamart were expected to collectively employ more than 4 lakh people by March 2025 as they expanded their dark store operations.
Even though this includes broader workforce numbers and not just riders, it still shows how large this ecosystem already is.

4) What is the market opportunity?:  
The market itself is growing fast, which makes this a strong long-term opportunity.
BCG reported in 2025 that rapid commerce in India could become a $20+ billion GMV opportunity by 2030, supported by a $2+ billion logistics market. Mordor Intelligence also estimates that the India quick-commerce market will grow from $3.65 billion in 2026 to $6.64 billion by 2031.
This tells us that the sector is not only growing, but also creating room for support systems and financial protection products built specifically for workers in this space.

5) What shows that this segment will keep growing?:  
There are already strong signs of rapid growth. Bain reported that quick-commerce GMV in India grew four times between 2022 and 2024. BCG also pointed out that the category is expected to grow at more than 45% annually.
That kind of expansion means more riders, more delivery density, and more dependence on this workforce, which also means stronger need for income protection solutions.

6) Why is this persona the best fit for our product?:  
For our use case, this persona makes the most sense. The rider works in a defined area, the earning loss happens quickly when disruptions occur, and the events affecting them can be tracked in a more reliable way.
That makes it easier for us to build a product that is simple to explain, practical to use, and realistic to automate. It also makes fraud checks more manageable because we can match claims against location, activity, and actual disruption events.


## Proposed Solution
![rider flowchart](https://i.ibb.co/CKCbWhbG/1.png)

## Platform Choice : Why Mobile

LastMile is built as a mobile app because the product's core features are only possible on a phone:

- **Riders work in the field** — they are on the move during shifts, not at a desk where a web platform would be accessible
- **Background GPS tracking** — verifying that a rider was active in a disrupted zone requires native mobile GPS, which cannot run reliably in a browser
- **Instant push notifications** — disruption alerts and payout confirmations need to reach the rider mid-shift without any action on their part
- **UPI integration** — payout confirmation is native to the Android ecosystem that nearly all quick-commerce riders use as their primary device
- **Device reality** — 90%+ of quick-commerce riders use Android smartphones as their only connected device; a web platform would simply not reach them

A web platform would lose the GPS layer, instant notifications, and seamless UPI experience — none of which are optional for this product.

## Frontend and Mobile App Flow

Our product is designed as a **mobile-first app** for quick-commerce delivery riders. The frontend is centered around a simple rider journey: onboarding, plan selection, coverage visibility, claims tracking, and payout status.

For the frontend, we plan to use **React Native + Expo + TypeScript**. This gives us a strong cross-platform setup for mobile development while keeping the code organized and scalable. For navigation, we plan to use **React Navigation** or **Expo Router**, depending on the final screen structure. Sensitive session data such as login tokens will be stored securely using **Expo SecureStore**.

### 1. Authentication

This is the entry point for both first-time and returning users.

**Screens**
- Splash Screen
- Welcome Screen
- Login
- OTP Verification

**Purpose**
- allow secure rider login
- restore session for returning users

---

### 2. Rider Onboarding

After login, the rider is guided through personal and work-related setup.

**Screens**
- Personal Details
- Work Profile
- Verification / Documents
- Delivery Zone Selection

**Key data collected**
- full name
- phone number
- city and state
- platform used (Blinkit / Zepto / Instamart)
- vehicle type
- average working hours
- average weekly earnings
- primary delivery zone
- store / hub mapping
- optional verification details

**Purpose**
- create the rider’s profile
- map the rider to a platform and operating area
- provide the backend with the data needed for pricing and claim eligibility

---

### 3. Quote and Plan Selection

Once onboarding is complete, the rider is shown available weekly protection plans.

**Screens**
- Quote Generation
- Plan Selection
- Policy Confirmation

**Purpose**
- show weekly premium
- allow comparison of available plans
- activate a suitable protection plan

**Plan information shown**
- premium amount
- coverage period
- covered events
- protection value

---

### 4. Main Dashboard

After policy activation, the rider enters the main app experience.

**Screens**
- Home Dashboard
- Coverage Summary
- Policy Details

**Purpose**
- show active coverage
- display policy details
- provide quick access to claims, payouts, and profile information

---

### 5. Claims and Payouts

This section gives the rider visibility into the claim and payout process.

**Screens**
- Claims Overview
- Claim Details
- Claim Status Timeline
- Wallet / Payouts
- Payout History

**Possible claim states**
- under review
- validated
- approved
- flagged
- payout initiated
- payout completed

**Purpose**
- show claim progress clearly
- display payout outcomes
- build transparency and trust in the system

---

### 6. Profile and Settings

This section allows the rider to review and manage account details.

**Screens**
- Rider Profile
- Work Profile Review
- Settings
- Logout / Account Switch

**Purpose**
- update profile details
- review work-related information
- manage account access safely

---

### Main Navigation

After onboarding, the app will use a simple navigation structure built around the most important parts of the rider journey:

- Home
- Coverage
- Claims
- Payouts
- Profile

---

### Frontend Responsibility

The frontend is mainly responsible for:
- collecting rider information
- managing the user journey
- displaying quotes, policies, claims, and payouts
- maintaining session state
- sending user actions to the backend
- rendering backend-calculated results

Heavy logic such as pricing, risk scoring, fraud checks, and claim decisioning will remain on the server side.

---

## Backend System and Processing Flow

The backend is designed as a **service-oriented system** that handles all core logic, automation, and integrations. It powers pricing, disruption detection, claim generation, and payouts, while the frontend focuses on user experience and interaction.

The system communicates with the frontend through **secure REST APIs** and processes all business logic, validations, and external data integrations required for real-time income protection.

### 1. Authentication and API Layer

This is the entry point for all requests coming from the mobile app.

**Responsibilities**
- handle incoming API requests
- validate request structure
- authenticate users using JWT tokens
- route requests to the correct services

**Flow**
- rider logs in using OTP
- backend generates a JWT token
- token is used for all future authenticated requests

---

### 2. User and Profile Service

This service manages all rider-related data collected during onboarding.

**Data stored**
- personal details
- work profile (platform, vehicle type)
- delivery zones and location
- working hours and availability

**Purpose**
- provide inputs for pricing and risk calculation
- support claim eligibility checks
- enable fraud validation

---

### 3. Insurance and Risk Engine

This is the core logic layer responsible for pricing and policy management.

**Responsibilities**
- generate quotes
- calculate weekly premiums
- create and manage policies

**Inputs**
- rider profile and work patterns
- location and delivery zone
- external signals such as weather and AQI

**Outputs**
- risk score
- premium amount
- coverage value

---

### 4. Trigger Engine

This component continuously monitors real-world conditions that affect rider earnings.

**Monitors**
- weather disruptions such as rain or flooding
- AQI levels
- platform or operational issues

**Purpose**
- detect when disruption thresholds are crossed
- identify affected riders based on location and active policy
- automatically initiate the claims process

---

### 5. Claims Processing

Claims are generated automatically when a disruption affects a rider.

**Process**
- identify eligible riders
- calculate income impact
- create claims linked to active policies

**Claim states**
- created
- under validation
- approved or rejected
- payout initiated
- payout completed

**Purpose**
- remove the need for manual claim filing
- ensure fast and consistent claim handling

---

### 6. Fraud Detection

Before approval, each claim is validated through a fraud detection layer.

**Checks**
- GPS and location verification
- duplicate claim detection
- mismatch between declared and actual activity

**Purpose**
- ensure only legitimate claims are approved
- maintain system reliability and trust

---

### 7. Payments and Payout Service

Once a claim is approved, payouts are processed automatically.

**Responsibilities**
- initiate payouts through payment gateways
- update transaction status
- maintain payout history

**Purpose**
- ensure fast and reliable compensation for riders

---

### 8. Data and Storage Layer

The backend uses a combination of databases and caching systems.

**Storage**
- PostgreSQL or MongoDB for primary data
- Redis for caching, OTP storage, and session support

**Data stored**
- user profiles
- policies
- claims
- transactions
- trigger logs

---

### 9. Background Processing

To support real-time automation, the system uses asynchronous processing.

**Handles**
- trigger monitoring
- claim generation
- payout execution

**Purpose**
- improve performance
- reduce response latency
- support scalability

---

### Backend Responsibility

The backend is responsible for:
- authentication and secure session management
- storing and managing rider data
- calculating pricing and risk scores
- detecting external disruptions
- automatically generating and validating claims
- processing payouts and maintaining transaction records

All critical logic is handled on the backend, enabling a fully automated system where claims and payouts are triggered without manual intervention.
