      function properties_whatever(){

      const inputs = [].slice.call(document.getElementById(constants.popoverID).shadowRoot.querySelectorAll('.controls input'));
      inputs.forEach(input => input.addEventListener('change', handleUpdate));

      function handleUpdate(e) {
        const suffix = (this.id === 'blur' ? 'px' : '%');
        var style_filter =this.id+`(${this.value}`+suffix+`)`;
        var image=document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.imageChangePropModalID[0]);
        var css_style=window.getComputedStyle(image).getPropertyValue("filter");
        var elements=css_style.split(" ");
        var new_css="";
        for ( var i=0; i<elements.length; i++){
        	if(elements[i].includes(String(this.id))){
        		elements.splice(i,1);
        		elements.push(style_filter);
        	}
        	new_css=new_css+" "+elements[i];
        }
         image.style.filter=new_css;
      }
  }