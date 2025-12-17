from pathlib import Path
import json
from typing import Optional

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/job-roles", tags=["job-roles"])

BASE_DIR = Path(__file__).resolve().parent.parent
ROLES_FILE = BASE_DIR / "data" / "roles.json"
SKILLS_FILE = BASE_DIR / "data" / "skills.json"


def load_roles_data():
    if not ROLES_FILE.exists():
        raise FileNotFoundError(f"roles.json not found at {ROLES_FILE}")
    with ROLES_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_skills_data():
    if not SKILLS_FILE.exists():
        raise FileNotFoundError(f"skills.json not found at {SKILLS_FILE}")
    with SKILLS_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/")
def get_all_job_roles():
    """
    Returns the full product_author -> product -> roles structure.
    Frontend can use this to build dynamic dropdowns.
    """
    data = load_roles_data()
    return data


@router.get("/authors")
def get_authors():
    data = load_roles_data()
    authors = list(data.get("product_authors", {}).keys())
    return {"authors": authors}


@router.get("/products")
def get_products(author: str):
    data = load_roles_data()
    authors = data.get("product_authors", {})
    if author not in authors:
        raise HTTPException(status_code=404, detail="Author not found")
    products = list(authors[author]["products"].keys())
    return {"author": author, "products": products}


@router.get("/roles")
def get_roles(author: str, product: str):
    data = load_roles_data()
    authors = data.get("product_authors", {})
    if author not in authors:
        raise HTTPException(status_code=404, detail="Author not found")

    products = authors[author]["products"]
    if product not in products:
        raise HTTPException(status_code=404, detail="Product not found for this author")

    roles = products[product].get("roles", [])
    return {"author": author, "product": product, "roles": roles}


@router.get("/skills")
def get_skills():
    """
    Returns all available skills organized by category and role.
    """
    try:
        data = load_skills_data()
        return data
    except FileNotFoundError:
        return {"base_skills": {}, "role_skills": {}}
