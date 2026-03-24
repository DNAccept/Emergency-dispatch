# Emergency Dispatch System - UI Navigation Guide

Welcome to the Emergency Dispatch System! This system is designed as a Micro Frontend Single Page Application (SPA), meaning you can seamlessly navigate between independent modules (Admin, Incidents, Dispatch, Analytics) without ever reloading the browser.

---

## 1. Getting Started & Authentication
* **Accessing the Portals**: Ensure all frontend and backend services are running. Navigate to the core Host Application at `http://localhost:5000` in Google Chrome or your preferred browser.
* **Logging In**: You will be greeted by a central login form. Use your registered `email` and `password`. You can click the **Eye Icon** in the password field to toggle password visibility.
* **Role-Based Access Control**: Your specific permissions define what modules and dashboard panels are visible to you. For example, a Police Administrator will see a different module set than a System Administrator. Check the `credentials.txt` file for test accounts.

---

## 2. The Global Navigation Bar
Once authenticated, a sleek, dark **Global Navigation Bar** appears permanently pinned to the top of your screen. 
* **Tab Switching**: Click on "User Management", "Incidents", "Dispatch", or "Analytics" to switch your entire screen to that dedicated module. 
* **Active State Indicator**: The navigation button for the module you are currently viewing will be slightly highlighted.
* **Stay Logged In**: Because the navbar is fixed, you can scroll through heavy incident lists and map visualizations without losing your main menu.
* **Logout**: To securely end your session and clear your authentication token, click the red **Logout** button on the far right.

---

## 3. Module Breakdown

### A. User Management (Admin Module)
This section allows users with administrative privileges to configure their respective agencies.
* **System Administrators**: You will see your own profile information and two toggles:
    * **Manage Users**: Review the System Directory, a comprehensive table of every user registered in the database, including their exact Role and join date.
    * **Register User**: Access the registration form to create new accounts for Hospital, Police, Fire, or System admins.
* **Hospital Administrators**: Find controls to increment or decrement **Available Beds** and **Ambulances Ready**. You can also manage a list of Medical Personnel schedules.
* **Police Station / Fire Administrators**: Easily access your station's roll-call, increment ready vehicles, or broadcast a "Station Readiness Level" adjustment (High/Moderate/Low) to the network.

### B. Incidents Module
This module is tailored for emergency reception, logging, and dispatching.
* **Interactive Map**: Centered by default on Accra. The map is completely interactive—you can click anywhere on the literal map interface to drop a new "Incident Marker". 
* **Incident Logging**: After dropping a marker on the map, the **Report New Emergency** form on the right populates the precise Latitude and Longitude coordinates. Fill in the incident severity, description, and submit.
* **Live Incident Feed**: Below the map, a real-time list actively updates with incoming emergencies.

### C. Dispatch Module
The Dispatch interface is the command center for monitoring available fleets and active assignments across the regions.
* **Command Map**: Shows active visual indicators for where available vehicles (Ambulances, Firetrucks, Police Cruisers) are currently stationed. 
* **Responder Workflows**: If you log in as an *Ambulance Driver/Responder*, your view replaces the global view with a "Responder Navigation Context". A live simulation will begin broadcasting your mock GPS coordinates as you virtually drive towards an assigned medical emergency on the map!

### D. Analytics Module
Reserved primarily for Government Executives and high-level supervisors acting on incident data.
* **Statistical Cards**: Highlights total incidents, active critical emergencies, and average system-wide response times.
* **Recent Incident Aggregation**: Presents a consolidated table breaking down incidents by categorization (Medical vs Fire vs Police).

---

## Technical Troubleshooting
* **Unknown Profile / Missing Buttons**: Our security tokens expire after 7 days. If your token expires or becomes corrupted, the Admin Module may state "Unknown User" or hide tools. Simply click **Logout** on the top Nav Bar and log back in to refresh it!
* **Map Not Refreshing Coordinates**: The maps natively cache their tiles. If the maps feel desynchronized, ensure you do not have multiple `npm run preview` processes clashing. Running `stop-frontends.bat` and restarting them cleanly resolves conflicts.
