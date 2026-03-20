# SUDO_SHUTDOWN-DEVTRAILS

**Team:** Sudo Shutdown

## Overview

### LastMile — an AI-Powered Parametric Income Protection for Quick-Commerce Riders

LastMile is a mobile-first parametric insurance platform that protects quick-commerce delivery riders from income loss caused by verified external disruptions.

## Problem Statement

Quick-commerce delivery riders are an essential part of the urban delivery ecosystem. Their earnings depend on continuous order flow, active working hours, and access to operational delivery zones.

However, external disruptions such as heavy rain, flooding, waterlogging, severe AQI, heatwaves, dark-store shutdowns, and platform outages can sharply reduce their ability to work and earn.

These disruptions are outside the rider’s control, yet they directly impact short-term income. Existing insurance systems do not address this specific problem well, because they are generally designed around health, life, accident, or asset protection rather than real-time, disruption-linked income loss.

This creates a gap in protection for gig workers whose income is volatile, weekly in nature, and highly sensitive to external operating conditions.

## Persona Selection

**1) What is our chosen persona?**  
Our chosen persona is quick-commerce delivery riders working with platforms like Blinkit, Zepto, and Swiggy Instamart.

**2) Why did we choose this persona?**  
We chose this group because they seem like the best fit for the kind of product we want to build. Their work is very time-sensitive and depends on constant order flow within a small delivery area. If something goes wrong in that area, like heavy rain, flooding, bad AQI, a dark store shutting down, or even a platform issue, their earnings can drop almost immediately. That makes this problem much easier to identify, measure, and solve through a weekly income-protection model.

**3) What is the estimated user base?**  
Exact rider-only numbers are not always publicly available. But the overall scale of the quick-commerce workforce is already very large. ET Retail reported in November 2024, citing TeamLease Services, that Blinkit, Zepto, and Swiggy Instamart were expected to collectively employ more than 4 lakh people by March 2025 as they expanded their dark store operations. Even though this includes broader workforce numbers and not just riders, it still shows how large this ecosystem already is.

**4) What is the market opportunity?**  
The market itself is growing fast, which makes this a strong long-term opportunity. BCG reported in 2025 that rapid commerce in India could become a $20+ billion GMV opportunity by 2030, supported by a $2+ billion logistics market. Mordor Intelligence also estimates that the India quick-commerce market will grow from $3.65 billion in 2026 to $6.64 billion by 2031. This tells us that the sector is not only growing, but also creating room for support systems and financial protection products built specifically for workers in this space.

**5) What shows that this segment will keep growing?**  
There are already strong signs of rapid growth. Bain reported that quick-commerce GMV in India grew four times between 2022 and 2024. BCG also pointed out that the category is expected to grow at more than 45% annually. That kind of expansion means more riders, more delivery density, and more dependence on this workforce, which also means stronger need for income protection solutions.

**6) Why is this persona the best fit for our product?**  
For our use case, this persona makes the most sense. The rider works in a defined area, the earning loss happens quickly when disruptions occur, and the events affecting them can be tracked in a more reliable way. That makes it easier for us to build a product that is simple to explain, practical to use, and realistic to automate. It also makes fraud checks more manageable because we can match claims against location, activity, and actual disruption events.

## Proposed Solution

![rider flowchart](https://i.ibb.co/CKCbWhbG/1.png)

## Platform Choice: Why Mobile

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

### Main Navigation

After onboarding, the app will use a simple navigation structure built around the most important parts of the rider journey:

- Home
- Coverage
- Claims
- Payouts
- Profile

### Frontend Responsibility

The frontend is mainly responsible for:
- collecting rider information
- managing the user journey
- displaying quotes, policies, claims, and payouts
- maintaining session state
- sending user actions to the backend
- rendering backend-calculated results

Heavy logic such as pricing, risk scoring, fraud checks, and claim decisioning will remain on the server side.

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

### 6. Fraud Detection

Before approval, each claim is validated through a fraud detection layer.

**Checks**
- GPS and location verification
- duplicate claim detection
- mismatch between declared and actual activity

**Purpose**
- ensure only legitimate claims are approved
- maintain system reliability and trust

### 7. Payments and Payout Service

Once a claim is approved, payouts are processed automatically.

**Responsibilities**
- initiate payouts through payment gateways
- update transaction status
- maintain payout history

**Purpose**
- ensure fast and reliable compensation for riders

### 8. Data and Storage Layer

The backend uses a combination of databases and caching systems.

**Storage**
- PostgreSQL for primary data
- Redis for caching, OTP storage, and session support

**Data stored**
- user profiles
- policies
- claims
- transactions
- trigger logs

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

## Fraud Detection and Claim Validation Engine

Our platform uses a separate **fraud detection and claim validation engine** to ensure that payouts are issued only for genuine disruption-linked income loss. This layer is independent from the pricing model and becomes active only after a valid claim candidate is created by the live trigger engine.

The purpose of this engine is not only to detect obvious fraud, but also to identify suspicious patterns, coordinated abuse, manipulated rider behavior, and false claims that may appear valid on the surface.

### Overall Design

The fraud system is designed as a **multi-layer validation pipeline** with three major parts:

1. **Rule-Based Checks**  
   These are hard validation rules used to immediately catch obvious violations.

2. **ML-Based Fraud Risk Scoring**  
   A machine learning model analyzes rider activity and behavioral patterns to estimate how suspicious a claim is.

3. **Decision Layer**  
   Based on the rule checks and fraud score, the claim is either approved, softly flagged, or escalated for further review.

This allows the platform to keep genuine payouts fast while still protecting itself against abuse.

### Types of Fraud the System is Designed to Detect

The fraud engine is built to handle multiple classes of suspicious behavior.

#### 1. Location Fraud
This happens when a rider falsely appears to be in an affected zone.

Examples:
- GPS spoofing
- fake presence in a high-risk area
- claiming exposure to a disruption in a zone where the rider was not genuinely active
- pretending to be near a shut dark store or high-payout cluster

#### 2. Activity Fraud
This happens when a rider was not actually working in a meaningful way but still attempts to claim income loss.

Examples:
- inactive rider trying to claim payout
- no normal work pattern in the claimed time window
- rider becoming active only around disruption time
- rider with no recent activity claiming major earnings loss

#### 3. Behavioral Fraud
This happens when the rider’s claim pattern appears manipulative or unnatural.

Examples:
- repeated claims in suspicious weeks
- sudden changes in normal operating zone before disruption
- multiple claims shortly after signup
- consistently claiming only during high-payout events
- unusual policy purchase timing before risky weeks

#### 4. Duplicate or Repeated Abuse
This happens when the same rider or linked accounts repeatedly attempt similar claims.

Examples:
- multiple claims for the same event
- repeated claims across related accounts
- same payout account or device being used by multiple users
- account recycling or duplicate identity behavior

#### 5. Coordinated or Syndicate Fraud
This is the most advanced form of fraud and becomes important in larger-scale abuse scenarios.

Examples:
- multiple riders appearing in the same risk zone at the same time
- synchronized claims across many accounts
- shared devices, payout accounts, or suspiciously similar movement patterns
- cluster attacks during expected disruption windows

### What the Fraud Engine Looks At

The fraud model does not depend on one single signal. Instead, it combines multiple groups of features to estimate how trustworthy a claim is.

#### A. Account and Identity Signals
These features help determine whether the rider account itself looks genuine.

Examples:
- account age
- days since signup
- KYC completion status
- device reuse across accounts
- payout account reuse across riders
- unusually fast first claim after account creation

#### B. Work Pattern Signals
These features measure whether the rider behaves like a real active worker.

Examples:
- average active days per week
- average working hours
- average deliveries per day
- consistency of work over past weeks
- usual working slots
- zone and store dependence
- normal earnings pattern

#### C. Location Authenticity Signals
These features help identify fake or manipulated location behavior.

Examples:
- continuity of movement
- realistic path and route patterns
- impossible location jumps
- mismatch between claimed zone and normal work zone
- time spent in the affected zone
- repeated exact presence in high-risk payout zones

#### D. Event Overlap Signals
These features measure whether the rider was genuinely exposed to the disruption.

Examples:
- active policy during event window
- covered zone match
- overlap between disruption time and rider’s normal work hours
- recent activity in that zone
- store / hub mapping consistency

#### E. Claim History Signals
These features help detect repeated suspicious usage patterns.

Examples:
- number of claims in recent weeks
- payout frequency
- flagged claim history
- repeated claims in similar event types
- repeated claims in the same zone
- claim timing concentration

#### F. Cross-Account and Network Signals
These features help detect coordinated abuse.

Examples:
- shared bank or UPI accounts
- shared devices
- shared networks
- synchronized claims
- common location clusters
- unusual similarity between multiple rider accounts

#### G. Policy Misuse Signals
These features help identify gaming of the product itself.

Examples:
- buying protection only in very risky weeks
- repeated last-minute policy purchases
- unusual plan upgrades before predicted disruption
- selecting high-value protection only during high-risk events

### ML Model Design

The fraud engine will use a **supervised machine learning classification model** trained on claim-level fraud features.

Each row in the fraud dataset represents a **claim or potential claim event**, along with the rider’s behavioral, location, account, and event-related signals.

The model’s purpose is to classify whether the claim is:
- likely genuine
- suspicious
- high-risk fraudulent

A suitable model for this is a **tabular classification model** such as:
- XGBoost Classifier
- LightGBM Classifier
- CatBoost Classifier

These models are well-suited for structured business data and can handle a large number of mixed features effectively.

### Fraud Score and Flagging Logic

Instead of making a simple yes/no decision, the model produces a **fraud risk score**.

This score is then used by the decision layer to determine the next step:

- **Low risk** → claim can move forward quickly
- **Medium risk** → claim is softly flagged for additional validation
- **High risk** → claim is held or escalated for review

This gives the system flexibility and reduces the chance of unfairly rejecting genuine riders.

### Rule-Based Checks

Before the ML model runs, the system can apply hard rules to catch obvious violations.

Examples:
- no active policy
- event outside insured zone
- event outside policy time window
- duplicate claim for the same event
- impossible location movement
- same payout account linked to multiple suspicious accounts

These checks help remove clear invalid claims early and reduce unnecessary model noise.

### Training the Fraud Model

In a real production setup, the model would be trained on historical labeled claims marked as:
- genuine
- suspicious
- fraudulent

For the current build, if real fraud data is limited, the model can be trained using a combination of:
- simulated rider activity
- synthetic fraud scenarios
- generated suspicious claim behavior
- rule-labeled examples

This allows us to create realistic training data for:
- fake zone presence
- GPS spoofing patterns
- duplicate claims
- suspicious new accounts
- repeated policy gaming
- coordinated group attacks

### Why This Matters

The fraud system is critical because the product is designed to automate parts of the claims process. Without a strong validation layer, the system would be vulnerable to false payouts, repeated abuse, and organized exploitation.

By combining:
- hard validation rules
- rider behavior analysis
- location authenticity checks
- claim history analysis
- cross-account similarity checks
- machine learning-based fraud scoring

the platform becomes more resilient, more trustworthy, and more scalable.

In short, the fraud engine helps answer one core question:

**Is this a genuine rider affected by a real disruption, or is this claim showing signs of manipulation or abuse?**

## Adversarial Defense & Anti-Spoofing Strategy

### The Threat
A coordinated syndicate using GPS spoofing applications can fake their location inside a 
disrupted zone while sitting at home, triggering false automatic payouts at scale. Basic GPS 
coordinate verification cannot catch this because the coordinates themselves look legitimate. 
This is precisely why LastMile's fraud engine is designed to go far beyond location alone.


### 1. The Differentiation — Genuine Rider vs Bad Actor

LastMile's fraud engine already analyzes location authenticity signals, work pattern signals, 
and event overlap signals as described in the Fraud Detection section above. For spoofing 
specifically, the system cross-references GPS coordinates against a set of device-level signals 
that a spoofing app cannot fake simultaneously.

A genuine rider caught in heavy rain will show:
- Slow erratic movement consistent with navigating flooded lanes on a two-wheeler
- Speed between 5–25 km/h with frequent stops
- Mobile data signal with fluctuating strength — consistent with outdoor movement
- Accelerometer and gyroscope data showing active motion and vibration
- Work pattern consistent with their historical shift behavior

A bad actor spoofing from home will show:
- Static or unnaturally smooth GPS movement
- Strong stable WiFi signal — inconsistent with being outdoors in a storm
- Zero accelerometer movement — the phone is physically still
- No gyroscope tilt or vibration
- GPS coordinates that don't match their normal operating zone

The system treats these device-level signals as a combined authenticity layer on top of the 
GPS coordinate check. A rider needs to pass both to trigger a payout.


### 2. The Data — Detecting a Coordinated Ring

Beyond the individual fraud signals already described in the fraud engine section, 
syndicate-level attacks produce network patterns that no legitimate disruption would generate:

- **Claim surge rate per zone** — if a large number of riders in the same zone all trigger 
claims within a narrow time window, this is flagged. Genuine disruptions affect riders 
gradually as they enter affected areas, not all at once
- **Cross-account network signals** — shared devices, shared UPI accounts, shared network 
connections, and synchronized claim timing across multiple accounts are all tracked as 
described in the Cross-Account and Network Signals section above
- **Device fingerprinting** — multiple accounts on the same physical device are caught 
through hardware ID tracking
- **Velocity impossibility checks** — GPS coordinates showing movement faster than any 
vehicle could physically achieve are flagged immediately using the Haversine formula
- **Zone peer comparison** — a rider suddenly claiming in a zone they have never 
historically operated in is anomalous and scored accordingly by the ML model

These signals feed directly into the fraud risk score. A coordinated ring attack raises the 
score across multiple accounts simultaneously, which itself becomes a detection signal at 
the network level.


### 3. The UX Balance — Protecting Honest Riders

The biggest risk in any anti-spoofing system is penalizing a genuine rider whose phone 
dropped GPS signal in bad weather — which is exactly when signal drops are most likely to 
occur. LastMile handles this through a benefit-of-the-doubt hold rather than immediate 
rejection.

As described in the fraud score and flagging logic above, claims are routed based on risk 
score:

- **Low risk** — payout fires immediately, no delay
- **Medium risk** — claim enters a short hold of maximum 2 hours. The rider receives a 
notification: *"Your disruption claim is being verified. You will hear back within 2 hours."* 
No action is required from them
- **High risk** — claim is held and escalated for review

During the hold window the system automatically checks whether the disruption remained 
active, whether the rider's GPS signal recovered and resumed normal movement, and whether 
all device-level signals resolve in the rider's favor. If they do, the payout fires automatically 
without any rider intervention.

What LastMile never does:
- Never asks a genuine rider to manually prove their location during a disruption
- Never permanently penalizes a rider for a single flagged claim
- A rider requires 3 flagged claims within 30 days before any account-level action is taken
- First-time flagged riders receive a transparent explanation of what the system looked for 
— not a vague rejection

This means a rider with a genuine GPS drop in bad weather experiences a short delay at 
worst. A bad actor running a coordinated spoof gets caught at the device signal layer before 
the hold even resolves.

## Development Plan

### **Phase 1 (Weeks 1–2):**
Research, ideation, persona definition, README documentation — no prototype built yet

### **Phase 2 (Weeks 3–4):**
- **Frontend:** Authentication screens, rider onboarding, quote and plan selection, main dashboard, claims and payout screens
- **Backend:** Authentication and API layer, user and profile service, insurance and risk engine, trigger engine, claims processing

### **Phase 3 (Weeks 5–6):**
- **Frontend:** Payout history screens, profile and settings, UI polish
- **Backend:** Fraud detection layer, payments and payout service, background processing, admin dashboard, final demo video and pitch deck

## LastMile in Action

### **Scenario — Claim Approved After Hold**
Meera is a Blinkit rider in Koramangala, Bengaluru. On a Monday evening, heavy rainfall crosses the trigger threshold in her zone. LastMile auto-generates a claim on her behalf. The fraud engine runs its checks — her GPS shows her in the zone, but her mobile signal briefly dropped during the storm, causing a 4-minute gap in location data. The rule-based check flags this as a medium-risk signal and moves the claim into a 2-hour hold. Meera receives a notification: "Your disruption claim is being verified. You will hear back within 2 hours." She continues her shift. Within 40 minutes, her GPS signal recovers, her accelerometer confirms consistent two-wheeler motion, and her movement pattern matches her historical shift behavior. All device-level signals resolve in her favor. The hold clears automatically and ₹75 is credited to her UPI account — no action required from Meera at any point.

### **Scenario — Claim Rejected**
Vikram has a Zepto rider account registered in HSR Layout. During a declared bandh affecting the zone, the trigger engine fires and auto-generates a claim. The fraud engine runs its checks. Vikram's GPS coordinates place him in the affected zone — but his accelerometer shows zero motion, his phone is connected to a home WiFi network with full signal strength, and his gyroscope shows no tilt or vibration consistent with riding. His work pattern signals show he has not completed a single delivery in the past 6 days, and this is his second claim in 8 days despite no recorded active shifts. His device ID is also linked to another account that claimed the same bandh event 12 minutes earlier. The ML model returns a high fraud risk score. The claim is automatically rejected. Vikram receives a notification: "Your claim could not be verified. Our system could not confirm active rider presence in the disrupted zone during the event window." No payout is issued.
