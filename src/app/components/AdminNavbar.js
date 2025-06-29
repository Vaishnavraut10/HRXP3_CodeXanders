'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import "./AdminNavbar.css"
export default function AdminNavbar() {
  const pathname = usePathname();

  const navStyle = {
    padding: '1rem',
    backgroundColor: '#56567c',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const linkStyle = (href) => ({
    color: pathname === href ? '#00c49f' : '#fff',
    marginRight: '1rem',
    textDecoration: 'none',
    fontWeight: pathname === href ? 'bold' : 'normal',
  });

  return (
    <nav style={navStyle}>
      <div>
        <Link href="/admin" className='link' style={linkStyle('/admin')}>
          Admin Panel
        </Link>
        <Link href="/admin/analytics" className='link' style={linkStyle('/admin/analytics')}>
          Analytics
        </Link>
      </div>
      <div>
        <Link href="/" className='link'  style={{ color: '#ff4c4c', textDecoration: 'none' }}>
          Logout
        </Link>
      </div>
    </nav>
  );
}