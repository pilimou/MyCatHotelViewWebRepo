$('#admin-btn').on('click', function() {
    //點擊 後台 按鈕
    // 執行摺疊動畫
    $('#input-sections').slideUp(400); // 原始三個大區塊向上收合
    $('#btn-container').hide();       // 隱藏計算按鈕
    
    // 動畫完成後顯示灰色 BAR 與 摘要
    $('#restore-bar').slideDown(200);
    $('#admin-section').fadeIn(600); // 摘要區塊淡淡地出現
    $('#admin-content').html();    
});