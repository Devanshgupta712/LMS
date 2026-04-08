'use client';

export default function TrustedBy() {
  const logos = [
    { name: 'Google', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
    { name: 'Microsoft', url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
    { name: 'Meta', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
    { name: 'Netflix', url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
    { name: 'Deloitte', url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg' },
    { name: 'Accenture', url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg' },
    { name: 'TCS', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg' },
    { name: 'Infosys', url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg' },
  ];

  return (
    <section style={{ 
      padding: '60px 0', 
      background: '#fff',
      borderBottom: '1px solid var(--border)'
    }}>
      <div className="container-wide" style={{ 
        maxWidth: '1280px', 
        padding: '0 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '40px'
      }}>
        {logos.map((logo) => (
          <div key={logo.name} style={{
            filter: 'grayscale(100%)',
            opacity: 0.5,
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '30px'
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.filter = 'grayscale(0%)'; }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.filter = 'grayscale(100%)'; }}
          >
            <img 
              src={logo.url} 
              alt={logo.name} 
              style={{ height: '100%', width: 'auto', maxWidth: '120px' }} 
            />
          </div>
        ))}
      </div>
    </section>
  );
}
