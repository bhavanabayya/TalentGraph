"""
Test script to verify recommendation engine is working
"""
from app.database import engine
from sqlmodel import Session, select
from app.models import Candidate, JobPost
from app.recommendation_engine import RecommendationEngine

with Session(engine) as session:
    # Get Sarah's profile
    candidate = session.exec(
        select(Candidate).where(Candidate.email == 'sarah.anderson@email.com')
    ).first()
    
    if not candidate:
        print("❌ Candidate not found!")
        exit(1)
    
    print(f"✅ Found candidate: {candidate.name}")
    print(f"   Role: {candidate.primary_role}")
    print(f"   Location: {candidate.location}")
    print(f"   Rate: ${candidate.rate_min}-${candidate.rate_max}/hr")
    print()
    
    # Get active jobs
    jobs = session.exec(
        select(JobPost).where(JobPost.status == 'active')
    ).all()
    
    print(f"✅ Found {len(jobs)} active jobs")
    print()
    
    # Prepare candidate data
    candidate_data = {
        'id': candidate.id,
        'name': candidate.name,
        'primary_role': candidate.primary_role,
        'location': candidate.location,
        'availability': candidate.availability,
        'work_type': candidate.work_type,
        'rate_min': candidate.rate_min,
        'rate_max': candidate.rate_max,
    }
    
    # Prepare jobs data
    jobs_data = []
    for job in jobs:
        jobs_data.append({
            'id': job.id,
            'title': job.title,
            'role': job.role,
            'seniority': job.seniority,
            'location': job.location,
            'work_type': job.work_type,
            'min_rate': job.min_rate,
            'max_rate': job.max_rate,
            'start_date': job.start_date,
            'description': job.description,
            'product_author': job.product_author,
            'product': job.product,
        })
    
    # Get recommendations
    print("🔄 Calculating recommendations...")
    try:
        recommendations = RecommendationEngine.recommend_jobs_for_candidate(
            candidate_data, [], jobs_data, top_n=5
        )
        
        print(f"✅ Generated {len(recommendations)} recommendations\n")
        
        if len(recommendations) == 0:
            print("⚠️  No recommendations found (all scores below 20% threshold)")
        else:
            print("Top 5 Matches:")
            print("=" * 80)
            for i, rec in enumerate(recommendations, 1):
                job = rec['job']
                print(f"\n{i}. {job['title']} - {rec['match_score']}% match")
                print(f"   Role: {job['role']} | Location: {job['location']}")
                print(f"   Rate: ${job['min_rate']}-${job['max_rate']}/hr")
                print(f"   Breakdown:")
                for key, value in rec['match_breakdown'].items():
                    if key != 'overall_score':
                        print(f"     - {key}: {value}%")
                if rec.get('match_reasons'):
                    print(f"   Reasons:")
                    for reason in rec['match_reasons']:
                        print(f"     • {reason}")
            
    except Exception as e:
        print(f"❌ Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
