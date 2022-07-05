let toggles = document.getElementsByClassName('toggles');
let textboxes = document.querySelectorAll('textarea');
let gates = document.getElementsByClassName('gates');
let th = document.querySelector('#accOrRefH');
let forms = document.querySelectorAll('[id^="form"]');

let checkedIndex = 0;

for(let i=0; i<gates.length; i++)
{
  forms[i].disabled = true;
  textboxes[i].disabled = true;
  gates[i].disabled = true;
  document.querySelector(`#button${i}`).disabled = true;
}

function loaded()
{
  let finish = true;
  for(let j=0; j<10; j++)
  {
    if(i > 9)
    {
       finish = false;
       break;
    }
  }
}




function controlOfCheckboxes(tg)
{

  for(let i=0; i<toggles.length; i++)
  {
    if(toggles[i].checked)
    {
       checkedIndex = i;
       break;
    }
  }
  //console.log(checkedIndex);
  for(let i=0; i<toggles.length; i++)
  {
    if(document.querySelector(`#accOrRef${checkedIndex}`).checked == true)
    {
      if(i == checkedIndex)
      {
         document.querySelector(`#button${i}`).disabled =  false;
         document.querySelector(`#resp${i}`).disabled =  false;
         document.querySelector(`#gates${i}`).disabled =  false;
         forms[i].disabled = false;
         forms[i].action = '/admin/refuseRefund';
         continue;
      }
      document.querySelector(`#accOrRef${i}`).disabled =  true;

      document.querySelector(`#gates${i}`).disabled =  true;
      document.querySelector(`#button${i}`).disabled = true;
    }
    else
    {
      forms[i].disabled = true;
      document.querySelector(`#accOrRef${i}`).disabled =  false;
      document.querySelector(`#resp${i}`).disabled =  true;
      document.querySelector(`#gates${i}`).checked =  false;
      document.querySelector(`#gates${i}`).disabled =  true;
      document.querySelector(`#button${i}`).disabled =  true;
      th.innerText = "RED";
    }
  }
  //gates[checkedIndex].disabled = false;
}

let innerTxt = "RED";
th.innerText = innerTxt;


function setHeader(ch)
{
  if(ch.checked)
  {
    innerTxt = "İADE";
    forms[checkedIndex].action = '/admin/registerRefund';
  }
  else
  {
    innerTxt = "RED";
    forms[checkedIndex].action = '/admin/refuseRefund';
  }

  th.innerText = innerTxt;
}
