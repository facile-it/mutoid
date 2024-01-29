import { createRoot } from 'react-dom/client'
import { AppInitializer } from './App'

const container = document.getElementById('root')
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!)

root.render(<AppInitializer />)
