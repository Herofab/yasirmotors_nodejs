
document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('header');
  var pos = header.getBoundingClientRect();

  window.addEventListener('scroll', function () {
    var windowpos = window.scrollY || window.pageYOffset;
    if (windowpos >= pos.top && windowpos >= 50) {
      header.classList.add('top');
    } else {
      header.classList.remove('top');
    }
  });
});


document.addEventListener('DOMContentLoaded', function () {
  var swiperContainers = document.querySelectorAll('.swiper-container');
  
  swiperContainers.forEach(function(container) {
    if (container) {
      var swiper = new Swiper(container, {
        loop: true,
        autoplay: {
          delay: 2500,
          disableOnInteraction: false,
        },
        // ... other parameters ...
      });
    } else {
      console.error('Swiper container not found');
    }
  });
});

let menu = document.querySelector('#menu-btn');
let navbar = document.querySelector('.navbar');

menu.onclick = () => {
  menu.classList.toggle('fa-times');
  navbar.classList.toggle('active');
}


document.querySelector('#login-btn').onclick = () => {
  document.querySelector('.login-form-container').classList.toggle('active');
}


document.querySelector('#close-login-form').onclick = () => {
  document.querySelector('.login-form-container').classList.remove('active');
}

document.querySelector('#reg-btn').onclick = () => {
  document.querySelector('.register-form-container').classList.toggle('active');
}
document.querySelector('#close-reg-form').onclick = () => {
  document.querySelector('.register-form-container').classList.remove('active');
}

document.querySelector('.home').onmousemove = (e) => {

  document.querySelectorAll('.home-parallax').forEach(elm => {

    let speed = elm.getAttribute('data-speed');

    let x = (window.innerWidth - e.pageX * speed) / 90;
    let y = (window.innerHeight - e.pageY * speed) / 90;

    elm.style.transform = `translateX(${y}px) translateY(${x}px)`
  });
}

document.querySelector('.home').onmouseleave = (e) => {

  document.querySelectorAll('.home-parallax').forEach(elm => {

    elm.style.transform = `translateX(0px) translateY(0px)`
  });
};


var swiper = new Swiper(".vehicles-slider", {
  slidesPerView: 1,
  spaceBetween: 20,
  loop: true,
  grabCursor: true,
  centeredSlides: true,
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 2,
    },
    991: {
      slidesPerView: 3,
    },
  },
});



