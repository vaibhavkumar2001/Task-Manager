import { BrowserRouter, Router } from "react-router";
import Router from "./routes";
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Router/>
    </BrowserRouter>
  )
}

export default App
