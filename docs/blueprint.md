# **App Name**: SheetSync Dashboard

## Core Features:

- Data Table Display: Display data fetched from Google Sheets in a sortable and filterable table format, showing Donor/Opp, Action/Next Step, Lead, Priority, and Probability.
- Google Sheet Sync: Fetch data dynamically from a specified Google Sheet. Implement a method for automatic data synchronization between the sheet and the dashboard.
- Admin Authentication: Implement a basic authentication system to protect the data entry page, allowing only authorized users to modify the data. Use environment variables instead of a database for authentication data.
- Data Entry Form: Create a form to input new data or edit existing entries, updating the Google Sheet upon submission. Input forms should support validation to avoid errors and improve user experience

## Style Guidelines:

- Primary color: Use a calm blue (#3498db) for the header and main navigation to convey trust and stability.
- Secondary color: Light gray (#f2f2f2) for backgrounds to provide contrast without being too distracting.
- Accent: Green (#2ecc71) for success messages and positive indicators; Red (#e74c3c) for errors or urgent actions.
- Use a clean, sans-serif font for readability across the dashboard.
- Implement a responsive layout that adapts to different screen sizes, ensuring usability on both desktop and mobile devices.
- Employ simple and recognizable icons to represent different data types and actions, enhancing user understanding.
- Subtle animations on data refresh or form submissions to provide feedback to the user without being intrusive.