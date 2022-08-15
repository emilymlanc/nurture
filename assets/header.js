jQuery( document ).ready(function() {
  $(".menu_open .icon-close").on("click", function(){ 
    $(this).parents().removeClass('menu-opening');
    $('body').removeClass('overflow-hidden-tablet');
  });
  
  $(".menu_open svg").click(function(){
    $(this).parents().removeClass('menu-opening');
    $('body').removeClass('overflow-hidden-undefined');
  }); 

  $("ul.menu-drawer__menu > li .parent_level").click(function(){
    $(this).next(".first__level").css('position', 'relative');
  });

  $("div.first__level ul.menu-drawer__menu > li.has-childmenu .menu-drawer__menu-item").click(function(){
    $(".parent_level_list li summary").css('opacity', '0');
    $(".parent_level_list > li > a").css('opacity', '0');
  });

  $("div.first__level ul.menu-drawer__menu > li.has-childmenu .menu-drawer__menu-item").click(function(){
    $(this).parents(".first__level").css('position', 'absolute');
    $(this).parents(".first__level").css('z-index', '999');
  });

  $(".menu-drawer__submenu .menu-drawer__close-button").click(function(){
    $(this).parents(".first__level").css('position', 'relative');
    $(this).parents(".first__level").css('z-index', '1');
  }); 

  $(".menu-drawer__submenu .menu-drawer__close-button").click(function(){
    $(".parent_level_list li summary").css('opacity', '1');
    $(".parent_level_list > li > a").css('opacity', '1');
  }); 

}); 