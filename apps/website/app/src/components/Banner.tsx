interface BannerProps {
    showLogo?: boolean;
  }
  
  const Banner = ({ showLogo = false }: BannerProps) => {
    return (
      <div className="relative">
        <img 
          src="/assets/images/SOLess-banner-1.png"
          alt="SOLess Banner"
          className="w-full h-auto rounded-xl"
        />
        {showLogo && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <img 
              src="/assets/images/SOLess-logo.png"
              alt="SOLess Logo"
              className="h-32 w-auto"
            />
          </div>
        )}
      </div>
    );
  };
  
  export default Banner;
