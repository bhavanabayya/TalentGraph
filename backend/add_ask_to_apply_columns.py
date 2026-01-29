"""
Add missing ask_to_apply columns to matchstate table in PostgreSQL
"""
from app.database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            # Add the three missing columns
            conn.execute(text("""
                ALTER TABLE matchstate 
                ADD COLUMN IF NOT EXISTS ask_to_apply_sent_at TIMESTAMP,
                ADD COLUMN IF NOT EXISTS ask_to_apply_expires_at TIMESTAMP,
                ADD COLUMN IF NOT EXISTS ask_to_apply_accepted BOOLEAN;
            """))
            conn.commit()
            print("✅ Successfully added columns:")
            print("   - ask_to_apply_sent_at (TIMESTAMP)")
            print("   - ask_to_apply_expires_at (TIMESTAMP)")
            print("   - ask_to_apply_accepted (BOOLEAN)")
        except Exception as e:
            print(f"❌ Error adding columns: {e}")
            raise

if __name__ == "__main__":
    print("Adding missing columns to matchstate table...")
    add_columns()
    print("\n✅ Migration complete!")
