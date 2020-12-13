		$(function(){
    	var $write = $('#write'),
        	shift = false,
        	capslock = false;
     
		$('#keyboard li').click(function(){
			var $this = $(this),
				character = $this.html(); // If it's a lowercase letter, nothing happens to this variable
         
			// Shift keys
/*			if ( $this.hasClass('switch') ) {
				//$('.letter').toggleClass('uppercase');
				$('.symbol span').toggle();
				$('.switch span').toggle();
             
				shift = (shift === true) ? false : true;
				capslock = false;
				return false;
			}
  */       
			// Caps lock
			if ($this.hasClass('switch')) {
				//$('.letter').toggleClass('uppercase');
				$('.symbol span').toggle();
				$('.switch span').toggle();
				capslock = true;
				return false;
			}

			// icon param
			if ($this.hasClass('param')) {
				
				document.getElementById('divKeyboard').style.display = 'none';
				document.getElementById('divParam').style.display = 'initial';
				return false;
			}

			// Delete
			if ($this.hasClass('delete')) {
				var html = $write.html();
             
				$write.html(html.substr(0, html.length - 1));
				getVille();
				return false;
			}
			
			// Delete
			if ($this.hasClass('deleteAll')) {
				var html = $write.html();
             
				$write.html('');
				getVille();
				return false;
			}
         
         	// RAZ 
         	if ($this.hasClass('raz')) {
				var html = $write.html();
             
				$write.html('');
				document.getElementById('itiRoad').innerHTML = '';
				document.getElementById('lstValues').innerHTML = '';
				itineraire = [];
				return false;
			}
			
			// ESC 
         	if ($this.hasClass('esc')) {
				
				document.getElementById('divControl').style.display = 'none';
				return false;
			}
         
			// Special characters
			if ($this.hasClass('symbol')) character = $('span:visible', $this).html();
			if ($this.hasClass('space')) character = ' ';
			if ($this.hasClass('tab')) character = "\t";
			if ($this.hasClass('return')) {
				searchDestination();
	//			character = "\n";
      		}
      		   
			// Uppercase letter
			if ($this.hasClass('uppercase')) character = character.toUpperCase();
         
			// Remove shift once a key is clicked.
			if (shift === true) {
				$('.symbol span').toggle();
				if (capslock === false) $('.letter').toggleClass('uppercase');
             
				shift = false;
			}
         
			// Add the character
			$write.html($write.html() + character);
			getVille();
		});
	});