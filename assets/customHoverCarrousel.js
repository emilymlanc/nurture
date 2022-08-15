var glidersPlus = document.getElementsByClassName('product-features__badge-group');

var buttons = document.getElementsByClassName('product-features__feature');

var hoverButton = false;

for(var j= 0; j< 9; j++) {
    buttons[j].addEventListener("mouseenter", function( event ) {
    hoverButton = true;
    clearInterval(interval); 
    glidersPlus[i].classList.remove("addVisibility");
    glidersPlus[i-1].classList.remove("addVisibility");
    glidersPlus[1].classList.remove("removeOpacity");
    
  }, false)
}

var i = 2;

var interval = setInterval(function(){
  
  	if(i>8){
     buttons[i-2].classList.remove("active");
  	 glidersPlus[i-1].classList.remove("addVisibility");
     i=1;
  	}
  
   if(hoverButton){
     glidersPlus[i].classList.remove("addVisibility");
     glidersPlus[i-1].classList.remove("addVisibility");
     clearInterval(interval);      	
    }
  
  if (1==i){
  	glidersPlus[1].classList.remove("removeOpacity");
    buttons[i-1].classList.add("active");
    
  }
  else {
    buttons[i-1].classList.add("active");
  	glidersPlus[i].classList.add("addVisibility");
  }
  
  if(i==2){
  	glidersPlus[1].classList.add("removeOpacity");
  }
  
  
  if(i>1){
    buttons[i-2].classList.remove("active");
  	glidersPlus[i-1].classList.remove("addVisibility");
  }
  i++;
    //d whatever here..
}, 2000);