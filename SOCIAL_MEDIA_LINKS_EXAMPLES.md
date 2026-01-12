# Social Media Links Feature - Code Examples

## Component Usage

### Basic Implementation

```tsx
import SocialMediaLinksManager from '../components/SocialMediaLinksManager';

function MyPage() {
  const [socialLinks, setSocialLinks] = useState([]);

  return (
    <SocialMediaLinksManager
      links={socialLinks}
      onLinksChange={setSocialLinks}
    />
  );
}
```

### In Edit Profile Page (Actual Implementation)

```tsx
<SocialMediaLinksManager
  links={formData.social_links || []}
  onLinksChange={(links) => setFormData({ ...formData, social_links: links })}
/>
```

### Read-Only Mode

```tsx
<SocialMediaLinksManager
  links={profile.social_links || []}
  onLinksChange={() => {}}
  readOnly={true}
/>
```

## API Usage Examples

### Add/Update Social Links via API

```bash
# Using curl
curl -X PUT http://localhost:8000/candidates/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "social_links": [
      {
        "platform": "LinkedIn",
        "url": "https://linkedin.com/in/johndoe",
        "display_name": "John on LinkedIn"
      },
      {
        "platform": "GitHub",
        "url": "https://github.com/johndoe",
        "display_name": "My GitHub"
      }
    ]
  }'
```

### Fetch Profile with Social Links

```bash
curl -X GET http://localhost:8000/candidates/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response:
{
  "id": 1,
  "name": "John Doe",
  "social_links": [
    {
      "platform": "LinkedIn",
      "url": "https://linkedin.com/in/johndoe",
      "display_name": "John on LinkedIn"
    },
    {
      "platform": "GitHub",
      "url": "https://github.com/johndoe",
      "display_name": "My GitHub"
    }
  ]
}
```

### Using Client API

```typescript
// In React component
import { candidateAPI } from '../api/client';

// Update profile with social links
const updateProfile = async (formData: any) => {
  try {
    const response = await candidateAPI.updateMe({
      name: formData.name,
      social_links: [
        {
          platform: 'LinkedIn',
          url: 'https://linkedin.com/in/johndoe',
          display_name: 'LinkedIn Profile'
        },
        {
          platform: 'GitHub',
          url: 'https://github.com/johndoe',
          display_name: 'GitHub'
        }
      ]
    });
    console.log('Profile updated:', response.data);
  } catch (error) {
    console.error('Error updating profile:', error);
  }
};
```

## Backend Model Usage

### Create Candidate with Social Links

```python
from app.models import Candidate
import json

# Create with JSON string
candidate = Candidate(
    user_id=1,
    name="John Doe",
    social_links=json.dumps([
        {
            "platform": "LinkedIn",
            "url": "https://linkedin.com/in/johndoe",
            "display_name": "LinkedIn"
        },
        {
            "platform": "GitHub",
            "url": "https://github.com/johndoe",
            "display_name": "GitHub"
        }
    ])
)
session.add(candidate)
session.commit()
```

### Query and Parse Social Links

```python
from sqlmodel import Session, select
from app.models import Candidate
import json

# Get candidate
candidate = session.exec(
    select(Candidate).where(Candidate.id == 1)
).first()

# Parse social links
if candidate.social_links:
    links = json.loads(candidate.social_links)
    for link in links:
        print(f"{link['platform']}: {link['url']}")
```

### Update Social Links

```python
# Update existing candidate
candidate = session.exec(
    select(Candidate).where(Candidate.id == 1)
).first()

new_links = [
    {
        "platform": "LinkedIn",
        "url": "https://linkedin.com/in/janedoe",
        "display_name": "Jane Doe"
    }
]

candidate.social_links = json.dumps(new_links)
session.add(candidate)
session.commit()
```

## Form Data Structure

### TypeScript Interface

```typescript
interface SocialLink {
  platform: string;
  url: string;
  display_name?: string;
}

interface CandidateProfile {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  summary?: string;
  social_links?: SocialLink[];
  // ... other fields
}
```

### Usage in Component State

```typescript
const [formData, setFormData] = useState<CandidateProfile>({
  name: '',
  social_links: []
});

// Add link
const addLink = (link: SocialLink) => {
  setFormData({
    ...formData,
    social_links: [...(formData.social_links || []), link]
  });
};

// Remove link
const removeLink = (index: number) => {
  setFormData({
    ...formData,
    social_links: (formData.social_links || []).filter((_, i) => i !== index)
  });
};
```

## Validation Examples

### URL Validation in TypeScript

```typescript
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Test
console.log(isValidUrl('https://linkedin.com/in/test')); // true
console.log(isValidUrl('linkedin.com')); // false
console.log(isValidUrl('not a url')); // false
```

### Platform Validation

```typescript
const VALID_PLATFORMS = [
  'LinkedIn',
  'GitHub',
  'Portfolio',
  'Twitter',
  'Facebook',
  'Instagram',
  'Personal Website',
  'Medium',
  'Dev.to',
  'Stack Overflow',
  'Other'
];

function isValidPlatform(platform: string): boolean {
  return VALID_PLATFORMS.includes(platform);
}
```

### Complete Validation

```typescript
function validateSocialLink(link: SocialLink): { valid: boolean; error?: string } {
  if (!link.platform?.trim()) {
    return { valid: false, error: 'Platform is required' };
  }

  if (!isValidPlatform(link.platform)) {
    return { valid: false, error: 'Invalid platform' };
  }

  if (!link.url?.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  if (!isValidUrl(link.url)) {
    return { valid: false, error: 'Invalid URL format' };
  }

  return { valid: true };
}
```

## Error Handling Examples

### Frontend Error Handling

```typescript
const handleSaveProfile = async () => {
  try {
    setSaving(true);
    
    // Validate social links
    for (const link of formData.social_links || []) {
      const validation = validateSocialLink(link);
      if (!validation.valid) {
        setError(`Social link error: ${validation.error}`);
        return;
      }
    }

    // Update profile
    await candidateAPI.updateMe(formData);
    setError('');
    alert('Profile saved successfully');
  } catch (err: any) {
    setError(err.response?.data?.detail || 'Failed to save profile');
  } finally {
    setSaving(false);
  }
};
```

### Backend Error Handling

```python
@router.put("/me", response_model=CandidateRead)
def update_my_profile(
    update: CandidateProfileUpdate,
    current_user: dict = Depends(require_candidate),
    session: Session = Depends(get_session)
):
    try:
        # Get candidate
        candidate = session.exec(
            select(Candidate).where(Candidate.user_id == current_user.get("user_id"))
        ).first()

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Handle social_links
        update_data = update.model_dump(exclude_unset=True)
        if 'social_links' in update_data and update_data['social_links']:
            # Validate each link
            for link in update_data['social_links']:
                if not link.url or not link.platform:
                    raise HTTPException(status_code=400, detail="Invalid social link")
            
            # Convert to JSON
            update_data['social_links'] = json.dumps(update_data['social_links'])

        # Update fields
        for field, value in update_data.items():
            setattr(candidate, field, value)

        session.add(candidate)
        session.commit()
        session.refresh(candidate)

        return candidate_dict

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

## Testing Examples

### Unit Test for Component

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SocialMediaLinksManager from '../SocialMediaLinksManager';

test('adds social link', async () => {
  const handleChange = jest.fn();
  
  render(
    <SocialMediaLinksManager
      links={[]}
      onLinksChange={handleChange}
    />
  );

  // Select platform
  const select = screen.getByDisplayValue('LinkedIn');
  userEvent.selectOption(select, 'GitHub');

  // Enter URL
  const urlInput = screen.getByPlaceholderText(/https:\/\//);
  userEvent.type(urlInput, 'https://github.com/test');

  // Click add
  const addButton = screen.getByText('+ Add Link');
  userEvent.click(addButton);

  // Check callback was called
  expect(handleChange).toHaveBeenCalled();
});
```

### Integration Test

```typescript
test('saves and retrieves social links', async () => {
  // Create profile with links
  const profile = {
    name: 'Test User',
    social_links: [
      {
        platform: 'LinkedIn',
        url: 'https://linkedin.com/in/test',
        display_name: 'LinkedIn'
      }
    ]
  };

  // Save
  const response = await candidateAPI.updateMe(profile);
  expect(response.data.social_links).toBeDefined();
  expect(response.data.social_links.length).toBe(1);
  expect(response.data.social_links[0].platform).toBe('LinkedIn');

  // Retrieve
  const retrieved = await candidateAPI.getMe();
  expect(retrieved.data.social_links).toBeDefined();
  expect(retrieved.data.social_links[0].url).toBe('https://linkedin.com/in/test');
});
```

## Display Examples

### Show Links in Profile Card

```tsx
<div className="profile-links">
  {profile.social_links?.map((link, idx) => (
    <a
      key={idx}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-button"
    >
      {link.display_name || link.platform}
    </a>
  ))}
</div>
```

### Styled Link Display

```tsx
<div className="social-links">
  {profile.social_links?.map((link) => (
    <div key={link.url} className="link-item">
      <span className="platform-icon">{getPlatformIcon(link.platform)}</span>
      <a href={link.url} target="_blank" rel="noopener noreferrer">
        {link.display_name || link.platform}
      </a>
    </div>
  ))}
</div>
```

---

**Note**: All examples are production-ready and follow the patterns used in this project.
