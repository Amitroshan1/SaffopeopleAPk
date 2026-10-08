import { AppFooter } from "../components/layout/AppFooter"
import { HeroSection } from "./HeroSection"
import "./style/HomePage.css"

export const HomePage = () =>{
  return(
    <div className="home-page-layout">
      <div className="home-scroll-area">
        <HeroSection/>
        <AppFooter />
      </div>
    </div>
  )
}
