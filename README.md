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


## Weekly Premium Calculation Logic

Our pricing system is designed to generate a **dynamic weekly insurance premium** instead of offering one fixed price to every rider. The idea is simple: the premium should reflect both the **likelihood of disruption** and the **amount of income the rider is trying to protect** in that particular week.

We do not price the policy only based on whether the week looks “good” or “bad.” Instead, we calculate the premium based on the rider’s **expected loss exposure** for the upcoming week.

### Core Pricing Principle

The weekly premium is based on three major components:

1. **Expected Weekly Earnings**  
   This estimates how much the rider is likely to earn in the coming week.

2. **Probability of Covered Disruption**  
   This estimates how likely it is that a covered disruption will affect the rider’s ability to work during that week.

3. **Loss Severity**  
   This estimates how much of the rider’s expected earnings could be lost if that disruption actually occurs.

Using these three components, the system calculates:

**Expected Loss = Expected Weekly Earnings × Probability of Disruption × Loss Severity**

After this, the expected loss is adjusted with business and product factors to generate the final premium.

**Final Premium = Expected Loss + Risk Loading + Operational Loading + Fraud Reserve + Plan Adjustment**

---

### Why the Premium Changes Every Week

The premium is dynamic because the rider’s risk is dynamic.

A rider’s weekly risk can change because of:
- weather conditions
- AQI and environmental conditions
- local shutdowns, bandhs, or curfews
- fuel price changes
- city-level demand shifts
- holiday and festival weeks
- major sports or public events
- weekly earnings pattern
- zone-level consumption trends
- store / hub dependency
- selected policy coverage

This means the same rider may not receive the same premium every week.

---

### How the System Thinks About Pricing

Our pricing logic combines **two important ideas**:

#### 1. Event Risk
This measures how likely it is that a covered disruption may happen.

Examples:
- heavy rain
- flooding or waterlogging
- severe AQI
- heatwave conditions
- bandh or curfew
- dark-store shutdown
- platform outage

If the system predicts that the coming week has a higher chance of such events, the premium increases.

#### 2. Earnings Exposure
This measures how much income is at risk if something goes wrong.

For example:
- festival weeks may increase order volume
- public holidays may increase demand
- cricket matches may increase food and grocery orders
- long weekends may increase rider earnings potential
- high-consumption zones may create larger earning opportunities

Even if the weather is stable, a rider may still receive a higher premium during a high-demand week because there is **more income to protect**.

This is important:  
A week can look “good” in terms of weather but still carry a higher premium if the rider’s expected earning opportunity is much higher than usual.

---

### Example of How Pricing Works

#### Normal Week
- Expected Weekly Earnings = ₹5,000
- Probability of Disruption = 8%
- Loss Severity = 20%

Expected Loss = ₹5,000 × 0.08 × 0.20 = ₹80

After adding loadings and adjustments, the final weekly premium may be around ₹95–₹110.

#### Festival or High-Consumption Week
- Expected Weekly Earnings = ₹7,000
- Probability of Disruption = 8%
- Loss Severity = 20%

Expected Loss = ₹7,000 × 0.08 × 0.20 = ₹112

In this case, the weather risk is the same, but the premium is still higher because the rider has more income at risk that week.

#### High-Risk Week
- Expected Weekly Earnings = ₹6,000
- Probability of Disruption = 20%
- Loss Severity = 30%

Expected Loss = ₹6,000 × 0.20 × 0.30 = ₹360

This week would receive a significantly higher premium because the system predicts both higher disruption risk and higher possible income loss.

---

### What the Pricing Model Considers

The pricing engine can use multiple categories of inputs:

#### Rider and Work Profile
- platform used
- vehicle type
- average working hours
- average working days per week
- average weekly earnings
- average deliveries per day
- work pattern during peak hours
- dependence on a specific zone or store
- number of active delivery zones
- income volatility

#### Zone and City Risk
- city and locality
- population density
- demand density
- quick-commerce penetration
- flood-prone score
- AQI history
- heat exposure
- local road and traffic vulnerability
- historical disruption frequency
- city consumption patterns

#### Weekly Context Signals
- weather forecast
- rainfall intensity
- flood alerts
- AQI levels
- heatwave alerts
- bandh or shutdown alerts
- local restrictions
- fuel price changes
- public holidays
- festival periods
- high-demand event weeks
- sports events
- local consumption spikes

#### Policy Features
- coverage selected
- policy tier
- payout cap
- insured earnings value
- covered risk categories
- coverage period

---

### ML Model Design

To support this pricing system, our product uses a **supervised machine learning regression model**.

The model is designed to estimate:
- expected weekly earnings
- probability of covered disruption
- expected loss severity

These model outputs are then used to compute expected weekly loss and generate the final premium.

Instead of using one fixed rule for everyone, the model allows pricing to adapt to:
- rider-specific behavior
- city and zone-specific conditions
- real-time weekly risk
- weekly earning opportunity

This makes pricing more realistic, explainable, and aligned with the actual working conditions of gig delivery riders.

---

### Final Pricing Philosophy

Our goal is to make the weekly premium:
- dynamic
- fair
- explainable
- risk-linked
- sensitive to both disruption risk and earning exposure

A rider should pay more when the coming week carries greater insured earning exposure or higher disruption probability, and less when the week is more stable and the expected payout risk is lower.

In short, our pricing model is designed to answer one core question:

**How much income is realistically at risk for this rider in the upcoming week, and what is the right weekly premium to protect it?**

## Live Trigger Engine

Our platform uses a **live trigger engine** to detect whether a valid covered disruption has occurred in the rider’s insured zone and policy window. Instead of using a machine learning model for this step, the system relies on **real-time event monitoring and rule-based checks**.

The engine continuously watches a defined set of covered triggers such as:
- heavy rain
- flooding / waterlogging
- severe AQI
- heatwave conditions
- dark-store shutdowns
- platform outages
- bandh / curfew / local shutdown events

When one of these triggers crosses the defined threshold, the system checks whether:
- the rider has an active policy
- the rider is covered in that zone
- the event overlaps the insured time window
- the trigger meets the payout conditions

If these checks are satisfied, the system creates a **potential claim event** and moves it to the next stage for validation and payout decisioning.

This makes the trigger layer objective, explainable, and well-suited for a parametric insurance workflow.

## Development Plan

### **Phase 1 (Weeks 1–2):** 
Research, ideation, persona definition, README documentation — no prototype built yet

### **Phase 2 (Weeks 3–4):**

- **Frontend**: Authentication screens, rider onboarding, quote and plan selection, main dashboard, claims and payout screens
- **Backend:** Authentication and API layer, user and profile service, insurance and risk engine, trigger engine, claims processing


### **Phase 3 (Weeks 5–6):**

- **Frontend:** Payout history screens, profile and settings, UI polish
- **Backend:** Fraud detection layer, payments and payout service, background processing, admin dashboard, final demo video and pitch deck
