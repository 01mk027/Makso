const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');
const listItemsPaymentMenuMobile = document.querySelector('#list-items-payment-menu-mobile');

listItemsPaymentMenuMobile.style.display = 'none';

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);




function showHidePaymentMenu() {
   var click = document.getElementById("list-items-payment-menu");
   if(click.style.display ==="block") {
      click.style.display ="none";
   } else {
      click.style.display ="block";
   }
}


function showHidePaymentMenuMobile() {
   if(listItemsPaymentMenuMobile.style.display ==="block") {
      listItemsPaymentMenuMobile.style.display ="none";
   } else {
      listItemsPaymentMenuMobile.style.display ="block";
   }
}
