import requests
import streamlit as st
import time

API_BASE = "http://127.0.0.1:8000"

st.set_page_config(page_title="TalentGraph", layout="centered")

# Professional Design System CSS
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    :root{
      --text-primary: #1f2937;
      --text-muted:   #6b7280;
      --text-soft:    #9ca3af;
      --border:       rgba(17,24,39,0.10);
      --card:         rgba(255,255,255,0.92);
      --shadow:       0 6px 18px rgba(17,24,39,0.06);
      --radius:       14px;
    }

    html, body, [class*="css"]{
      font-family: 'Inter', 'Segoe UI', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }

    /* Global spacing */
    .ds-spacer-xl { margin-top: 28px; }
    .ds-spacer-lg { margin-top: 18px; }
    .ds-spacer-md { margin-top: 12px; }
    .ds-spacer-sm { margin-top: 8px;  }

    /* Typography */
    .ds-h1{
      font-size: 34px;
      font-weight: 650;
      letter-spacing: -0.03em;
      margin: 0 0 10px 0;
      color: var(--text-primary);
    }
    .ds-h2{
      font-size: 26px;
      font-weight: 620;
      letter-spacing: -0.02em;
      margin: 0 0 8px 0;
      color: var(--text-primary);
    }
    .ds-h3{
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: var(--text-primary);
    }
    .ds-h4{
      font-size: 12px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 0 0 4px 0;
      color: var(--text-muted);
    }
    .ds-body{
      font-size: 14px;
      line-height: 1.65;
      color: var(--text-primary);
      margin: 0;
    }
    .ds-muted{
      font-size: 13px;
      line-height: 1.55;
      color: var(--text-muted);
      margin: 0;
    }
    .ds-soft{
      font-size: 12px;
      line-height: 1.55;
      color: var(--text-soft);
      margin: 0;
    }

    /* Card polish (works well with st.container(border=True)) */
    div[data-testid="stVerticalBlockBorderWrapper"]{
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    /* Inputs */
    input, textarea, select{
      font-size: 14px !important;
      font-family: inherit !important;
    }

    /* Buttons */
    button{
      font-family: inherit !important;
      font-weight: 550 !important;
      letter-spacing: 0.01em;
      border-radius: 12px !important;
    }

    /* Sidebar text */
    section[data-testid="stSidebar"] *{
      font-family: inherit !important;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# -------------------------------
# Session state setup
# -------------------------------
if "authed_email" not in st.session_state:
    st.session_state.authed_email = None

if "candidate_id" not in st.session_state:
    st.session_state.candidate_id = None

if "current_page" not in st.session_state:
    st.session_state.current_page = "Login"

if "access_token" not in st.session_state:
    st.session_state.access_token = None

if "page_override" not in st.session_state:
    st.session_state.page_override = None


def auth_headers():
    """Return Authorization header if logged in, else empty dict."""
    if st.session_state.access_token:
        return {"Authorization": f"Bearer {st.session_state.access_token}"}
    return {}


@st.cache_data
def load_job_roles():
    try:
        resp = requests.get(f"{API_BASE}/job-roles")  # public
        if resp.status_code == 200:
            return resp.json()
        return {}
    except Exception:
        return {}


roles_data = load_job_roles()
authors_data = roles_data.get("product_authors", {})

# -------------------------------
# Sidebar navigation
# -------------------------------
pages = ["Login", "Profile", "Resumes", "Applications"]

page = st.sidebar.radio(
    "Menu",
    pages,
    index=pages.index(st.session_state.current_page),
)

# page override
if st.session_state.page_override:
    page = st.session_state.page_override
    st.session_state.page_override = None

# login indicator + logout
if st.session_state.access_token and st.session_state.authed_email:
    st.sidebar.success(f"Logged in as {st.session_state.authed_email}")
    if st.sidebar.button("Logout"):
        st.session_state.authed_email = None
        st.session_state.access_token = None
        st.session_state.candidate_id = None
        st.session_state.current_page = "Login"
        st.session_state.page_override = "Login"
        st.rerun()
else:
    st.sidebar.info("Not logged in")

# keep sync
st.session_state.current_page = page


# =========================================================
# PAGE 1: LOGIN (real email OTP)
# =========================================================
if page == "Login":
    st.markdown("<div class='ds-h1'>Login (Email OTP)</div>", unsafe_allow_html=True)
    st.markdown("<p class='ds-muted'>Enter your email and verify with OTP to access your profile.</p>", unsafe_allow_html=True)

    email = st.text_input("Email address", value=st.session_state.authed_email or "")
    col1, col2 = st.columns(2)

    with col1:
        if st.button("Send OTP"):
            if not email or "@" not in email:
                st.error("Enter a valid email.")
            else:
                try:
                    resp = requests.post(f"{API_BASE}/auth/send-otp", json={"email": email})  # public
                    if resp.status_code == 200:
                        st.session_state.authed_email = email
                        st.success("OTP sent to your email.")
                    else:
                        st.error(resp.text)
                except Exception as e:
                    st.error(f"Backend error: {e}")

    code_input = st.text_input("Enter OTP", max_chars=6)

    with col2:
        if st.button("Verify & Login"):
            if not st.session_state.authed_email:
                st.error("Enter email and click Send OTP first.")
            else:
                try:
                    resp = requests.post(
                        f"{API_BASE}/auth/verify-otp",
                        json={"email": st.session_state.authed_email, "code": code_input},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        st.session_state.access_token = data["access_token"]
                        st.success("Logged in successfully!")

                        # Try to load existing candidate profile by email
                        try:
                            headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                            profile_resp = requests.get(
                                f"{API_BASE}/candidates/by-email/{st.session_state.authed_email}",
                                headers=headers
                            )
                            if profile_resp.status_code == 200:
                                candidate_data = profile_resp.json()
                                st.session_state.candidate_id = candidate_data["id"]
                                st.info("Profile loaded! Redirecting to your profile...")
                            else:
                                st.info("No existing profile found. Create one on the Profile page.")
                        except Exception:
                            st.info("Creating a new profile...")

                        # Auto-redirect to Profile
                        st.session_state.page_override = "Profile"
                        st.session_state.current_page = "Profile"
                        st.rerun()
                    else:
                        st.error(resp.text)
                except Exception as e:
                    st.error(f"Backend error: {e}")

    st.info("After login you will be redirected to Profile.")


# =========================================================
# PAGE 2: PROFILE (create candidate + top dashboard summary)
# =========================================================
elif page == "Profile":
    st.markdown("<div class='ds-h1'>Candidate Profile</div>", unsafe_allow_html=True)
    st.markdown("<p class='ds-muted'>Review your profile summary and keep your information up to date.</p>", unsafe_allow_html=True)

    if not st.session_state.authed_email or not st.session_state.access_token:
        st.warning("Please log in first from the **Login** page.")
        st.stop()

    headers = auth_headers()

    # Load skills data from backend
    @st.cache_data
    def load_skills_data():
        try:
            resp = requests.get(f"{API_BASE}/job-roles/skills")
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            st.warning(f"Could not load skills: {e}")
        return {"base_skills": {}, "role_skills": {}}

    skills_data = load_skills_data()

    # Profile dashboard summary
    st.markdown("<div class='ds-h2'>Profile Summary</div>", unsafe_allow_html=True)
    st.markdown("<p class='ds-muted'>A quick view of your candidate information and preferences.</p>", unsafe_allow_html=True)

    if st.session_state.candidate_id:
        try:
            resp = requests.get(
                f"{API_BASE}/candidates/{st.session_state.candidate_id}",
                headers=headers,
            )
            if resp.status_code == 200:
                data = resp.json()

                # Professional Profile Card Layout
                with st.container():
                    st.markdown(f"<div class='ds-h3'>{data.get('name', 'Candidate Name')}</div>", unsafe_allow_html=True)
                    st.markdown(f"<p class='ds-body' style='color: #6b7280; margin-bottom: 16px;'>{data.get('primary_role', 'Professional Title')}</p>", unsafe_allow_html=True)
                    
                    # Quick stats in a clean grid
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.markdown(f"<p class='ds-h4'>Experience</p>", unsafe_allow_html=True)
                        st.markdown(f"<p class='ds-body'>{data.get('years_experience', '-')} years</p>", unsafe_allow_html=True)
                    with col2:
                        st.markdown(f"<p class='ds-h4'>Rate</p>", unsafe_allow_html=True)
                        st.markdown(f"<p class='ds-body'>${data.get('rate_min', 0):.0f}–${data.get('rate_max', 0):.0f}/hr</p>", unsafe_allow_html=True)
                    with col3:
                        st.markdown(f"<p class='ds-h4'>Location</p>", unsafe_allow_html=True)
                        st.markdown(f"<p class='ds-body'>{data.get('location', '-')}</p>", unsafe_allow_html=True)

                # Background Section
                with st.container():
                    st.markdown("<div class='ds-h3'>Background</div>", unsafe_allow_html=True)
                    st.markdown("<p class='ds-muted'>Work history, education, location</p>", unsafe_allow_html=True)
                    st.divider()
                    
                    col_status, col_career = st.columns(2)
                    with col_status:
                        st.markdown(f"<p class='ds-h4'>Status</p>", unsafe_allow_html=True)
                        st.markdown(f"<p class='ds-body'>{data.get('availability', 'N/A')}</p>", unsafe_allow_html=True)
                    with col_career:
                        st.markdown(f"<p class='ds-h4'>Career Path</p>", unsafe_allow_html=True)
                        st.markdown(f"<p class='ds-body'>{', '.join([r.strip() for r in data.get('primary_role', 'N/A').split(',')[:1]])}</p>", unsafe_allow_html=True)
                    
                    col_education, col_loc = st.columns(2)
                    with col_education:
                        st.markdown(f"<p class='ds-h4'>Product Expert</p>", unsafe_allow_html=True)
                        st.markdown(f"<p class='ds-body'>{data.get('product_author', '-')} - {data.get('product', '-')}</p>", unsafe_allow_html=True)
                    with col_loc:
                        st.markdown(f"<p class='ds-h4'>Location</p>", unsafe_allow_html=True)
                        st.markdown(f"<p class='ds-body'>{data.get('location', 'N/A')}</p>", unsafe_allow_html=True)

                # Experience Section
                with st.container():
                    st.markdown("<div class='ds-h3'>Experience & Skills</div>", unsafe_allow_html=True)
                    st.markdown("<p class='ds-muted'>Responsibilities, expertise, tools</p>", unsafe_allow_html=True)
                    st.divider()
                    
                    col_level, col_projects = st.columns(2)
                    with col_level:
                        st.markdown(f"<p class='ds-h4'>Experience Level</p>", unsafe_allow_html=True)
                        st.markdown(f"<p class='ds-body'>{data.get('years_experience', 'N/A')} years</p>", unsafe_allow_html=True)
                    with col_projects:
                        if data.get('certifications'):
                            certs = data.get('certifications', [])
                            cert_names = ", ".join([c['name'] for c in certs[:2]])
                            st.markdown(f"<p class='ds-h4'>Certifications</p>", unsafe_allow_html=True)
                            st.markdown(f"<p class='ds-body'>{cert_names}</p>", unsafe_allow_html=True)
                    
                    # Skills Section
                    if data.get('skills'):
                        st.markdown("<p class='ds-h4' style='margin-top: 12px;'>Technical Skills</p>", unsafe_allow_html=True)
                        skills = data.get('skills', [])
                        skill_names = ", ".join([s['name'] for s in skills[:8]])
                        st.markdown(f"<p class='ds-body'>{skill_names}</p>", unsafe_allow_html=True)

                # Job Preferences Section
                with st.container():
                    st.markdown("<div class='ds-h3'>Preferences</div>", unsafe_allow_html=True)
                    st.divider()
                    
                    prefs = []
                    if data.get('preference_1'): prefs.append(f"• {data.get('preference_1')}")
                    if data.get('preference_2'): prefs.append(f"• {data.get('preference_2')}")
                    if data.get('preference_3'): prefs.append(f"• {data.get('preference_3')}")
                    
                    if prefs:
                        st.markdown(f"<p class='ds-body'>{chr(10).join(prefs)}</p>", unsafe_allow_html=True)
                    else:
                        st.markdown("<p class='ds-soft'>No preferences specified</p>", unsafe_allow_html=True)

                # Resumes
                if data.get('resumes'):
                    st.markdown("---")
                    st.markdown("<p class='ds-h4'>Uploaded Resumes</p>", unsafe_allow_html=True)
                    for resume in data.get('resumes', []):
                        st.markdown(f"<p class='ds-body'>• {resume['filename']}</p>", unsafe_allow_html=True)
            else:
                st.info("No saved profile found yet. Create one below.")
        except Exception as e:
            st.error(f"Error loading profile summary: {e}")
    else:
        st.info("No profile created yet. Fill the form below.")

    st.markdown("---")
    st.markdown("<div class='ds-h2'>Create / Update Profile</div>", unsafe_allow_html=True)

    st.markdown("<p class='ds-h4' style='margin-top: 24px;'>Basic Information</p>", unsafe_allow_html=True)
    name = st.text_input("Name", label_visibility="collapsed", placeholder="Full Name")
    email = st.text_input("Email", value=st.session_state.authed_email, label_visibility="collapsed", placeholder="Email Address")
    location = st.text_input("Location", label_visibility="collapsed", placeholder="City, State / Country")

    st.markdown("<p class='ds-h4' style='margin-top: 24px;'>Professional Information</p>", unsafe_allow_html=True)
    author_options = ["Select..."] + list(authors_data.keys())
    product_author = st.selectbox("Product Author", author_options, index=0)

    product = None
    available_roles = []
    if product_author != "Select..." and product_author in authors_data:
        product_options = list(authors_data[product_author]["products"].keys())
        product = st.selectbox("Product", product_options)
        
        # Get available roles for this product
        if product and product in authors_data[product_author]["products"]:
            available_roles = authors_data[product_author]["products"][product]["roles"]
    else:
        product = st.text_input("Product (if not in list)")

    # Multi-select job preferences based on available roles
    st.markdown("<p class='ds-h4' style='margin-top: 24px;'>Job Role Preferences</p>", unsafe_allow_html=True)
    if available_roles:
        selected_roles = st.multiselect(
            "Select your preferred job roles",
            options=available_roles,
            default=[],
            help="Select one or more roles you are interested in"
        )
        primary_role = ", ".join(selected_roles) if selected_roles else None
    else:
        st.info("Select a Product Author and Product to see available roles")
        primary_role = st.text_input("Or enter a custom role")
        selected_roles = []
    years_exp = st.number_input("Years of Experience", min_value=0, max_value=40, value=3)
    availability = st.text_input("Availability (e.g. Immediate, 2 weeks)")
    rate_min = st.number_input("Min Rate (USD/hr)", min_value=0.0, value=80.0)
    rate_max = st.number_input("Max Rate (USD/hr)", min_value=0.0, value=120.0)

    st.markdown("<p class='ds-h4' style='margin-top: 24px;'>Location & Job Preferences</p>", unsafe_allow_html=True)
    pref1 = st.text_input("Preference 1", label_visibility="collapsed", placeholder="e.g., Remote, Full-time")
    pref2 = st.text_input("Preference 2", label_visibility="collapsed", placeholder="e.g., Project-based")
    pref3 = st.text_input("Preference 3", label_visibility="collapsed", placeholder="e.g., International")

    # Dynamic skills selection based on product author, product, and selected roles
    st.markdown("<p class='ds-h4' style='margin-top: 24px;'>Select Your Skills</p>", unsafe_allow_html=True)
    
    # Gather all available skills for selected roles
    all_available_skills = set()
    
    # Add base skills
    if skills_data and "base_skills" in skills_data:
        for category, skills_list in skills_data["base_skills"].items():
            all_available_skills.update(skills_list)
    
    # Add role-specific skills
    if (skills_data and "role_skills" in skills_data and 
        product_author != "Select..." and 
        product_author in skills_data.get("role_skills", {}) and
        product and product in skills_data["role_skills"][product_author]):
        
        product_skills = skills_data["role_skills"][product_author][product]
        
        # Add skills for each selected role
        if selected_roles:
            for role in selected_roles:
                if role in product_skills:
                    all_available_skills.update(product_skills[role])
    
    # Sort and display as multiselect
    if all_available_skills:
        sorted_skills = sorted(list(all_available_skills))
        selected_skills = st.multiselect(
            "Select your skills",
            options=sorted_skills,
            default=[],
            help="Select all skills you have experience with"
        )
    else:
        st.info("Select a Product Author and Product, then choose roles to see recommended skills")
        selected_skills = []
        # Allow manual entry if no skills available
        skills_text = st.text_area(
            "Or enter skills manually (comma-separated)",
            value="",
            help="Enter skills manually if not found in the list above",
        )
        selected_skills = [s.strip() for s in skills_text.split(",") if s.strip()]

    if st.button("Save Profile"):
        skills_payload = [
            {"name": s.strip(), "level": "Intermediate"}
            for s in selected_skills
            if s.strip()
        ]

        payload = {
            "name": name,
            "email": email,
            "location": location,
            "product_author": product_author if product_author != "Select..." else None,
            "product": product,
            "primary_role": primary_role,
            "years_experience": years_exp,
            "availability": availability,
            "rate_min": rate_min,
            "rate_max": rate_max,
            "preference_1": pref1,
            "preference_2": pref2,
            "preference_3": pref3,
            "skills": skills_payload,
            "certifications": [],
        }

        try:
            resp = requests.post(
                f"{API_BASE}/candidates/",
                json=payload,
                headers=headers,
            )
            if resp.status_code == 200:
                data = resp.json()
                st.session_state.candidate_id = data["id"]
                st.success(f"Profile saved. Candidate ID: {data['id']}")
                st.info("Redirecting you to **Resumes**...")

                st.session_state.page_override = "Resumes"
                st.session_state.current_page = "Resumes"
                st.rerun()
            else:
                st.error(f"Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            st.error(f"Error connecting to backend: {e}")


# =========================================================
# PAGE 3: RESUMES
# =========================================================
elif page == "Resumes":
    st.markdown("<div class='ds-h1'>Resume Management</div>", unsafe_allow_html=True)
    st.markdown("<p class='ds-muted'>Upload and manage your professional resumes.</p>", unsafe_allow_html=True)

    if not st.session_state.authed_email or not st.session_state.access_token:
        st.warning("Please log in first.")
        st.stop()

    if not st.session_state.candidate_id:
        st.info("Please create your profile first on the **Profile** page.")
        st.stop()

    headers = auth_headers()
    candidate_id = st.session_state.candidate_id

    # Upload section with container
    with st.container():
        st.markdown("<div class='ds-h3'>Upload Your Resume</div>", unsafe_allow_html=True)
        st.markdown("<p class='ds-soft'>Upload your resume for potential matches and role fit scoring.</p>", unsafe_allow_html=True)

        resume_file = st.file_uploader("Upload Resume (PDF/DOC)", type=["pdf", "doc", "docx"])

        if resume_file and st.button("Upload Resume", use_container_width=True):
            files = {
                "file": (
                    resume_file.name,
                    resume_file.getvalue(),
                    resume_file.type or "application/octet-stream",
                )
            }
            try:
                resp = requests.post(
                    f"{API_BASE}/candidates/{candidate_id}/resumes",
                    files=files,
                    headers=headers,
                )
                if resp.status_code == 200:
                    st.success("Resume uploaded and saved successfully!")
                    st.rerun()
                else:
                    st.error(f"Error: {resp.status_code} - {resp.text}")
            except Exception as e:
                st.error(f"Error connecting to backend: {e}")

    st.markdown("")
    # Saved Resumes section with container
    with st.container():
        st.markdown("<div class='ds-h3'>Saved Resumes</div>", unsafe_allow_html=True)

        try:
            resp = requests.get(
                f"{API_BASE}/candidates/{candidate_id}/resumes",
                headers=headers,
            )
            if resp.status_code == 200:
                resumes = resp.json()
                if not resumes:
                    st.info("No resumes uploaded yet. Upload your first resume above!")
                else:
                    for idx, r in enumerate(resumes):
                        with st.container():
                            col1, col2 = st.columns([3, 1])
                            with col1:
                                st.markdown(f"**{r['filename']}**")
                            with col2:
                                view_url = f"{API_BASE}/candidates/{candidate_id}/resumes/{r['id']}/download"
                                st.link_button("View", view_url, use_container_width=True)
            else:
                st.error(f"Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            st.error(f"Error connecting to backend: {e}")


# =========================================================
# PAGE 4: APPLICATIONS
# =========================================================
elif page == "Applications":
    st.markdown("<div class='ds-h1'>Applications & Role Fit</div>", unsafe_allow_html=True)
    st.markdown("<p class='ds-muted'>Test how well your profile matches specific job roles.</p>", unsafe_allow_html=True)

    if not st.session_state.authed_email or not st.session_state.access_token:
        st.warning("Please log in first.")
        st.stop()

    if not st.session_state.candidate_id:
        st.info("Please create your profile first on the **Profile** page.")
        st.stop()

    headers = auth_headers()
    candidate_id = st.session_state.candidate_id
    st.caption(f"Compute role-fit score for candidate ID: {candidate_id}")

    if not authors_data:
        st.error("Job role ontology not loaded from backend.")
        st.stop()

    author_options = ["Select..."] + list(authors_data.keys())
    author_for_fit = st.selectbox("Product Author", author_options, index=0)

    product_for_fit = None
    roles_for_fit = []

    if author_for_fit != "Select..." and author_for_fit in authors_data:
        products_map = authors_data[author_for_fit]["products"]
        product_keys = list(products_map.keys())
        product_for_fit = st.selectbox("Product", product_keys)

        if product_for_fit in products_map:
            roles_for_fit = products_map[product_for_fit]["roles"]

    selected_role = None
    if roles_for_fit:
        selected_role = st.selectbox("Job Role", roles_for_fit)

    # Load resumes to choose from
    resumes_list = []
    try:
        resp = requests.get(
            f"{API_BASE}/candidates/{candidate_id}/resumes",
            headers=headers,
        )
        if resp.status_code == 200:
            resumes_list = resp.json()
    except Exception:
        pass

    resume_id = None
    if resumes_list:
        resume_labels = [f"[{r['id']}] {r['filename']}" for r in resumes_list]
        selected_resume_label = st.selectbox("Select Resume", resume_labels)
        idx = resume_labels.index(selected_resume_label)
        resume_id = resumes_list[idx]["id"]
    else:
        st.info("No resumes available yet – go to Resumes page to upload.")

    if selected_role and resume_id and st.button("Get Role Fit Score"):
        payload = {
            "product_author": author_for_fit,
            "product": product_for_fit,
            "job_role": selected_role,
            "resume_id": resume_id,
        }
        try:
            resp = requests.post(
                f"{API_BASE}/candidates/{candidate_id}/role-fit",
                json=payload,
                headers=headers,
            )
            if resp.status_code == 200:
                data = resp.json()
                st.success("Role-fit score computed (placeholder logic).")
                st.metric("Role Fit Score", f"{data['score']}%")
                with st.expander("Details"):
                    st.json(data)
            else:
                st.error(f"Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            st.error(f"Error connecting to backend: {e}")


