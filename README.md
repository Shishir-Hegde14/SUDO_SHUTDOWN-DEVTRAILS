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

## Frontend Flow and User Experience

The frontend of our product is designed as a mobile-first experience for quick-commerce delivery riders. The app flow is structured around the rider journey from onboarding to policy activation, claims tracking, and payout visibility.

### 1. Entry and Authentication
This is the starting point of the app and handles first-time users as well as returning users.

Screens included:
- Splash Screen
- Welcome Screen
- Login
- OTP Verification

Purpose:
- introduce the app
- authenticate the rider
- restore session for returning users

### 2. Rider Onboarding
After login, the rider is guided through personal and work-related setup.

Screens included:
- Personal Profile Setup
- Work Profile Setup
- Verification / Documents
- Delivery Zone Selection

Purpose:
- capture the rider’s personal details
- collect work-related information
- map the rider to a platform and operating area
- build the base for pricing and claim eligibility

Important inputs collected:
- name and phone number
- city and state
- platform (Blinkit / Zepto / Instamart)
- vehicle type
- average work hours
- weekly earnings
- delivery zone / store mapping

### 3. Quote and Plan Selection
Once onboarding is complete, the rider is shown available weekly protection plans.

Screens included:
- Quote Generation Screen
- Plan Selection Screen
- Policy Confirmation Screen

Purpose:
- show weekly pricing
- help the rider compare plans
- allow activation of a suitable protection plan

This stage helps the rider understand:
- premium amount
- covered events
- coverage period
- protection value

### 4. Main Dashboard
Once the policy is active, the rider enters the main app experience.

Primary screens included:
- Home Dashboard
- Coverage Summary
- Policy Details
- Weekly Protection Status

Purpose:
- show whether the rider is currently covered
- display active plan details
- provide quick access to claims, payouts, and profile details

### 5. Claims Flow
The claims section is designed to give the rider visibility into the protection process.

Screens included:
- Claims Overview
- Claim Details
- Claim Status Timeline

Purpose:
- show claims linked to the rider’s policy
- display status updates
- explain the progress of claim processing

Possible claim states:
- under review
- validated
- approved
- flagged
- payout initiated
- payout completed

### 6. Payout and Earnings View
Once a claim is approved, the rider can view payout-related details inside the app.

Screens included:
- Wallet / Payouts
- Payout History
- Protected Earnings Summary

Purpose:
- show payout amount
- show payout history
- display how much income has been protected over time

### 7. Profile and Settings
This section allows the rider to manage account and work-related details.

Screens included:
- Rider Profile
- Work Profile Review
- Settings
- Logout / Account Switch

Purpose:
- update profile details
- review work information
- manage account access

### Main Navigation
After onboarding, the rider enters a simple navigation structure built around the key parts of the product.

Planned main navigation:
- Home
- Coverage
- Claims
- Payouts
- Profile

