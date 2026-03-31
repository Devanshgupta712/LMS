'use client';

const ComparisonRow = ({ feature, traditional, apptechno }: { feature: string, traditional: string, apptechno: string }) => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr 1fr', 
      padding: '24px 0', 
      borderBottom: '1px solid var(--border)',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>{feature}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>{traditional}</div>
      <div style={{ 
        fontSize: '15px', 
        fontWeight: 600, 
        color: 'var(--primary)', 
        textAlign: 'center',
        background: 'rgba(var(--primary-h), 84%, 54%, 0.05)',
        padding: '12px',
        borderRadius: '12px'
      }}>{apptechno}</div>
    </div>
  );
};

export default function Comparison() {
  const comparisons = [
    { feature: 'Certification', traditional: 'Only Degree/Diploma', apptechno: '6-Month MNC Experience' },
    { feature: 'Learning Method', traditional: 'Theory & Labs', apptechno: 'Production-Grade Projects' },
    { feature: 'Placement Policy', traditional: 'Placement Assistance', apptechno: 'Unlimited Interview Calls' },
    { feature: 'Soft Skills', traditional: 'None', apptechno: 'AI English Coach Included' },
    { feature: 'MNC Standards', traditional: 'Not Covered', apptechno: 'Full Exposure to MNC Workflow' }
  ];

  return (
    <section style={{ padding: '120px 0', background: 'var(--bg-primary)' }}>
      <div className="container-wide" style={{ maxWidth: '1000px', padding: '0 var(--space-8)' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 600, marginBottom: '24px', letterSpacing: '-0.04em' }}>Why AppTechno?</h2>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>A new category of technical immersion that goes beyond bootcamps.</p>
        </div>

        <div className="glass-premium" style={{ padding: '40px 60px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            paddingBottom: '24px', 
            borderBottom: '2px solid var(--border)',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)'
          }}>
            <div>Feature</div>
            <div style={{ textAlign: 'center' }}>Traditional Bootcamps</div>
            <div style={{ textAlign: 'center', color: 'var(--primary)' }}>AppTechno Software</div>
          </div>

          {comparisons.map((c, i) => (
            <ComparisonRow key={i} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
