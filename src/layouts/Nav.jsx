import { NavLink } from 'react-router-dom'

function Sidebar() {

    return (
        <nav style={{ width: '180px', borderRight: '1px solid #ccc', minHeight: '100vh', padding: '16px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                    <NavLink to="/users">Users</NavLink>
                </li>
                <li style={{ marginBottom: '8px' }}>
                    <NavLink to="/vulnerabilities">Vulnerabilities</NavLink>
                </li>
            </ul>
        </nav>
    )
}

export default Sidebar