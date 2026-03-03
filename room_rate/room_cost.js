 $(document).ready(function() {
    
    // --- A. 從後端抓取資料並產生 Checkbox ---
    function loadExtraServices() {
        // 這裡換成您的 API 網址
        $.ajax({
            url: 'https://mycathotelrepo.onrender.com/queryRoomCost', 
            type: 'POST',
            dataType: 'json',
            success: function(data) {
                const $list = $('#extra-services-list');
                $list.empty(); // 清除載入中文字

                $.each(data, function(i, item) {
                    // item 格式假設為 { id: 1, name: "剪指甲", price: 100 }
                    const html = `
                        <label class="service-item">
                            <input type="checkbox" class="extra-check" 
                                    data-name="${item.costName}" 
                                    data-price="${item.costPrice}" value="${item.id}">
                            <span style="margin-left:10px;">${item.costName}</span>
                            <span class="service-price">$${item.costPrice}</span>
                        </label>
                        `;
                    $list.append(html);
                });
            },
            error: function() {
                $('#extra-services-list').html('<p>無法載入項目</p>');
            }
        });
    }
    loadExtraServices(); // 頁面載入後執行
});
