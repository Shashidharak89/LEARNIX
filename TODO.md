# TODO: Add Active Time Tracking Feature

## Backend Changes
- [x] Update Work model to add 'active' field (Number, default 0)
- [x] Create new API endpoint /api/user/active to increment active time
- [x] Update /api/user GET route to include 'active' field in response

## Frontend Changes
- [x] Add timer logic in Navbar to send increment request every 60 seconds
- [x] Create utility function to format active time (e.g., 9m, 7h 6m)
- [x] Update UserProfile.js to display active time in user stats
- [x] Update UserDetailsPage.js to display active time in profile stats

## Testing
- [ ] Test API endpoints
- [ ] Test timer functionality
- [ ] Test display formatting
- [ ] Test viewing other users' active time
