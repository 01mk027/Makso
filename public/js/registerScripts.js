let sel = document.querySelector('#isAdmin');
//stationAuth,paymentAuth,customerAuth
let stationAuth = document.querySelector('#stationAuth');
let stationAuthId = document.querySelector('#stationAuthId');

let paymentAuth = document.querySelector('#paymentAuth');
let paymentAuthId = document.querySelector('#paymentAuthId');

let customerAuth = document.querySelector('#customerAuth');
let customerAuthId = document.querySelector('#customerAuthId');

let refundAuth = document.querySelector('#refundAuth');
let refundAuthId = document.querySelector('#refundAuthId');



function loaded()
{
  paymentAuth.style.visibility = "hidden";
  stationAuth.style.visibility = "hidden";
  customerAuth.style.visibility = "hidden";
  refundAuth.style.visibility = "hidden";
  paymentAuthId.style.visibility = "hidden";
  stationAuthId.style.visibility = "hidden";
  customerAuthId.style.visibility = "hidden";
  refundAuthId.style.visibility = "hidden";
}




function handleChange()
{
  if(sel.value == "true")
  {
    paymentAuth.style.visibility = "visible";
    stationAuth.style.visibility = "visible";
    customerAuth.style.visibility = "visible";
    refundAuth.style.visibility = "visible";
    paymentAuthId.style.visibility = "visible";
    stationAuthId.style.visibility = "visible";
    customerAuthId.style.visibility = "visible";
    refundAuthId.style.visibility = "visible";
    paymentAuth.setAttribute("required","");
    stationAuth.setAttribute("required","");
    customerAuth.setAttribute("required","");
    refundAuth.setAttribute("required","");
  }
  else
  {
    paymentAuth.style.visibility = "hidden";
    stationAuth.style.visibility = "hidden";
    customerAuth.style.visibility = "hidden";
    refundAuth.style.visibility = "hidden";
    paymentAuthId.style.visibility = "hidden";
    stationAuthId.style.visibility = "hidden";
    customerAuthId.style.visibility = "hidden";
    refundAuthId.style.visibility = "hidden";
    paymentAuth.removeAttribute("required");
    stationAuth.removeAttribute("required");
    customerAuth.removeAttribute("required");
    refundAuth.removeAttribute("required");
  }
}
