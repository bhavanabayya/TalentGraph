# Social Media Links Feature - Implementation Guide

## Overview

The social media links feature allows candidates to add, manage, and display professional links (LinkedIn, GitHub, Portfolio, etc.) on their profile. Links are stored as JSON in the database and displayed as clickable hyperlinks on the profile overview.

## Architecture

### Backend

**Database Model** ([models.py](backend/app/models.py)):
```python
class Candidate(SQLModel, table=True):
    social_links: Optional[str] = None  # JSON: [{"platform": "LinkedIn", "url": "https://...", "display_name": "View on LinkedIn"}, ...]
```

**Schema** ([schemas.py](backend/app/schemas.py)):
```python
class SocialLink(BaseModel):
    platform: str  # "LinkedIn", "GitHub", "Portfolio", "Twitter", etc.
    url: str
    display_name: Optional[str] = None

class CandidateBase(BaseModel):
    social_links: Optional[List[SocialLink]] = None

class CandidateProfileUpdate(BaseModel):
    social_links: Optional[List[SocialLink]] = None
```

**Router** ([routers/candidates.py](backend/app/routers/candidates.py)):
- `GET /candidates/me` - Returns profile with parsed social_links
- `PUT /candidates/me` - Updates profile with social_links (converts list to JSON)
- `GET /candidates/{candidate_id}` - Public profile with parsed social_links

### Frontend

**Component** ([components/SocialMediaLinksManager.tsx](react-frontend/src/components/SocialMediaLinksManager.tsx)):
- Input fields for platform, URL, and optional display name
- Platform dropdown with predefined options (LinkedIn, GitHub, Portfolio, Twitter, etc.)
- URL validation (must be valid URL format)
- Add button with keyboard shortcut (Enter key)
- List of added links with remove buttons
- Read-only mode for profile preview
- Responsive design for mobile

**Styling** ([styles/SocialMediaLinksManager.css](react-frontend/src/styles/SocialMediaLinksManager.css)):
- Modern gradient background
- Smooth transitions and hover effects
- Platform-specific icons (emoji-based)
- Responsive grid layout
- Dark mode support

**Integration Points**:
- [EditProfilePage.tsx](react-frontend/src/pages/EditProfilePage.tsx) - Full editing mode
- [CandidateDashboard.tsx](react-frontend/src/pages/CandidateDashboard.tsx) - Display and editing

## Data Flow

### Adding a Social Link

1. **Frontend**: User enters platform, URL, and optional display name
2. **Validation**: Component validates URL format before allowing add
3. **State Update**: Link added to local state (`formData.social_links`)
4. **Display**: Link appears in list with platform icon
5. **Save**: When user clicks "Save Profile", form data sent to backend

### Backend Processing

1. **Receive**: `PUT /candidates/me` endpoint receives `social_links: List[SocialLink]`
2. **Convert**: List converted to JSON string via `json.dumps()`
3. **Store**: JSON stored in `Candidate.social_links` field in database
4. **Return**: Endpoint returns parsed social_links as list

### Displaying Links

1. **Fetch**: Profile retrieved via `GET /candidates/me`
2. **Parse**: JSON string parsed back to list via `json.loads()`
3. **Display**: Links shown as clickable buttons with icons
4. **Icons**: Platform icons displayed as emojis
5. **Links**: Hyperlinks open in new tab with `target="_blank"` and `rel="noopener noreferrer"`

## Platform Options

The component supports these platforms:
- **LinkedIn** - Professional network
- **GitHub** - Code repository & portfolio
- **Portfolio** - Personal website/portfolio
- **Twitter** - Social media presence
- **Facebook** - Social media presence
- **Instagram** - Social media presence
- **Personal Website** - Custom website
- **Medium** - Blog/writing platform
- **Dev.to** - Developer community
- **Stack Overflow** - Q&A platform
- **Other** - Catch-all for other platforms

## URL Validation

URLs are validated using the native URL constructor:
```javascript
try {
  new URL(urlString);
  return true;
} catch {
  return false;
}
```

Valid formats:
- `https://linkedin.com/in/yourprofile`
- `https://github.com/username`
- `https://myportfolio.com`
- etc.

Invalid formats will show error message: "Please enter a valid URL (e.g., https://linkedin.com/in/...)"

## Database Schema Changes

The `Candidate` table now includes:

```sql
ALTER TABLE candidate ADD COLUMN social_links VARCHAR NULL;
```

(This happens automatically on startup via SQLModel's create_all)

Example stored value:
```json
[
  {
    "platform": "LinkedIn",
    "url": "https://linkedin.com/in/johndoe",
    "display_name": "LinkedIn Profile"
  },
  {
    "platform": "GitHub",
    "url": "https://github.com/johndoe",
    "display_name": "GitHub"
  }
]
```

## API Request/Response Examples

### Update Profile with Social Links

**Request**:
```bash
PUT /candidates/me
{
  "name": "John Doe",
  "summary": "...",
  "social_links": [
    {
      "platform": "LinkedIn",
      "url": "https://linkedin.com/in/johndoe",
      "display_name": "John on LinkedIn"
    },
    {
      "platform": "GitHub",
      "url": "https://github.com/johndoe",
      "display_name": "GitHub Profile"
    }
  ]
}
```

**Response** (CandidateRead):
```json
{
  "id": 1,
  "name": "John Doe",
  "summary": "...",
  "social_links": [
    {
      "platform": "LinkedIn",
      "url": "https://linkedin.com/in/johndoe",
      "display_name": "John on LinkedIn"
    },
    {
      "platform": "GitHub",
      "url": "https://github.com/johndoe",
      "display_name": "GitHub Profile"
    }
  ]
}
```

## Usage Instructions for Users

### Adding Links

1. Go to "Edit Profile" page
2. Scroll to "Social Media & Professional Links" section
3. Select platform from dropdown (e.g., "LinkedIn")
4. Enter full URL (e.g., "https://linkedin.com/in/yourname")
5. Optionally add custom display name
6. Click "+ Add Link" or press Enter
7. Link appears in the list below
8. Click "Save Profile" at bottom to save all changes

### Managing Links

- **Remove**: Click the "✕" button next to any link to remove it
- **Edit**: Remove the link and add it again with new details
- **View**: Links display as clickable buttons in profile overview

### On Profile Overview

- Links shown with platform icons (emojis)
- Display name is clickable and hyperlinked
- Hover shows tooltip with full URL
- New tab opens when clicked

## Features

✅ Add multiple social/professional links  
✅ Support 11+ platform types  
✅ URL validation  
✅ Custom display names  
✅ Remove links  
✅ Responsive design  
✅ Read-only mode for profile preview  
✅ Platform icons (emoji-based)  
✅ Keyboard shortcut (Enter to add)  
✅ Error handling  
✅ Dark mode support  

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Performance

- Lightweight component (~5KB minified)
- JSON storage efficient
- No external dependencies
- CSS transitions smooth at 60fps

## Error Handling

- **Invalid URL**: Shows error message and prevents adding
- **Duplicate URL**: Prevents adding same URL twice
- **Network error on save**: Profile update fails gracefully with error message
- **JSON parsing error**: Falls back to empty list if stored JSON is corrupted

## Testing

### Manual Test Cases

1. **Add valid link**: Add LinkedIn URL, verify it appears in list
2. **Invalid URL**: Try adding "not a url", verify error message
3. **Duplicate**: Add same URL twice, verify error message
4. **Remove link**: Add link, click remove, verify it disappears
5. **Save and reload**: Add links, save, reload page, verify links persist
6. **Read-only mode**: View profile in non-edit mode, verify links display correctly
7. **Mobile responsiveness**: Test on phone-sized viewport
8. **Dark mode**: Enable dark mode, verify styling applies

## Future Enhancements

- [ ] Link icons from platform's official branding (currently emoji)
- [ ] Drag-to-reorder links
- [ ] Link preview on hover
- [ ] Analytics tracking for link clicks
- [ ] Custom platform icons upload
- [ ] Link verification/validation
- [ ] Auto-detect platform from URL
- [ ] Social sharing of links
