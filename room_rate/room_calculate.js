    $('#calc-btn').on('click', function() {
        //點擊 計算 按鈕

        // 1. 尋找被勾選的房型
        let $selectedRoom = $('input[name="roomType"]:checked').closest('.room-card');

        if ($selectedRoom.length === 0) {
        alert("請先選擇一個房型！");
        return;
        }

        // 2. 擷取該區塊輸入的資料
        let roomName = $selectedRoom.find('.room-name').text();
        let price = $selectedRoom.find('.price-box').val();
        let cats = $selectedRoom.find('.cat-count').val();
        let dateStart = $selectedRoom.find('.check-in').val();  // 入住日期
        let dateEnd = $selectedRoom.find('.check-out').val();    // 退房日期
        let nights = $selectedRoom.find('.night-count').val();
        let rawDiscount = $selectedRoom.find('.custom-discount').val();
        let freeCatQuota = $selectedRoom.find('.freeCatQuota').val();
   
        let addCatPrice = initialDataStore.RoomDiscounts.extraCatFee;

        // 3. 檢查日期是否完整填寫
        if (!dateStart || !dateEnd || nights <= 0) {
            alert("請填寫完整的入住與退房日期！");
        return;
        }

        // 3-1. 提醒預約日期是否在優惠折扣日期
        if( dateStart < initialDataStore.RoomDiscounts.startDate ){
            alert('提醒!! 預約起始日期小於優惠日期');
        } else if( dateEnd > initialDataStore.RoomDiscounts.endDate ){
            alert('提醒!! 預約結束日期大於優惠日期');
        }

        // 4. 計算房型天數金額
        // 4-1. 計算有無多貓加價數量
        let totalAddCatCount = (cats - freeCatQuota) > 0 ? (cats - freeCatQuota) : 0;

        // 4-2. 如果有自訂%數，轉換成折扣
        let nightDiscount = 100;
        if (rawDiscount !== "" && !isNaN(rawDiscount)) {
            nightDiscount = rawDiscount;
        } else {
            //如果沒有自訂，就看幾晚決定幾折
            switch (true) {
            case (nights < 3):
                nightDiscount = initialDataStore.RoomDiscounts.oneAndTwoNight;
                break;
            case (nights < 7):
                nightDiscount = initialDataStore.RoomDiscounts.threeNight;
                break;
            case (nights < 14):
                nightDiscount = initialDataStore.RoomDiscounts.sevenNight;
                break;
            case (nights < 21):
                nightDiscount = initialDataStore.RoomDiscounts.fourteenNight;
                break;
            case (nights < 30):
                nightDiscount = initialDataStore.RoomDiscounts.twentyOneNight;
                break;
            case (nights > 30):
                nightDiscount = initialDataStore.RoomDiscounts.thirtyNight;
                break;
            default:
            }

        }
        nightDiscount = parseFloat(nightDiscount) / 100;
        
        // 4-3. 計算房間總價
        let total = price;
        
        total = ( Math.floor(( parseFloat(price) * nightDiscount / 10 ) + Math.floor(( totalAddCatCount * addCatPrice ) * nightDiscount / 10) ) ) * 10 * nights;
        //total =  Math.floor(( parseFloat(price) + totalAddCatCount * addCatPrice ) * nightDiscount / 10) * 10 * nights;

        // 4-4-1. 抓最後折扣 Checkbox 選中的服務與加總金額
        let extraTotal = 0;
        let extraNames = [];
        let extrasHtml = ''; // 用來存放 HTML 格式的清單
        
        $('.service-item .extra-check:checked').each(function() {
            extraTotal += parseFloat($(this).data('price'));
            extraNames.push($(this).data('name') + " " + $(this).data('price'));
        });

        // 4-4-2. 抓每晚折扣 Checkbox 選中的服務與加總金額
        let extraTotal2 = 0;
        let extraNames2 = [];
        let extrasHtml2 = '';
        let totalNightDiscount = 0;

        $('.service-item2 .extra-check:checked').each(function() {
            totalNightDiscount = parseFloat($(this).data('price')) * nights
            extraTotal2 += totalNightDiscount;
            extraNames2.push($(this).data('name') + " " + $(this).data('price') + " * " + nights + "晚 = " + totalNightDiscount);
        });

        // 4-3. 組合敘述
        if (extraNames2.length > 0) {
            // 將每個每晚折扣選中的名稱包在 div 裡，達成自動換行
            extrasHtml2 = extraNames2.map(name => `<div class="summary-extra-item">• ${name}</div>`).join('');
        }

        if (extraNames.length > 0) {
            // 將每個最後折扣選中的名稱包在 div 裡，達成自動換行
            extrasHtml = extraNames.map(name => `<div class="summary-extra-item">• ${name}</div>`).join('');
        } 

        if(!extraNames.length > 0 && !extraNames2.length > 0){
             extrasHtml = '<div>無</div>';
        } else {
            extrasHtml = extrasHtml + extrasHtml2;
        }
       
        extraTotal = extraTotal + extraTotal2;
        let finalTotle = (total - extraTotal).toLocaleString('en-US');

        // 5. 組合摘要文字

        // 如果加貓數量 = 0 ， 就不要顯示
        let shortMulaText = '';
        let shortSumText = '';
        if (totalAddCatCount > 0){
            shortMulaText = ` [ ( ${roomName} * 折扣 ) 去尾數 + ( 多貓加價 ${addCatPrice} * 折扣 ) 去尾數 ] * 共幾晚`;
            //shortMulaText = ` ( ${roomName} + 多貓加價 ${addCatPrice} ) * 折扣 * 共幾晚`;
            shortSumText = ` [ ( ${price} * ${nightDiscount} ) 去尾數 + (${totalAddCatCount} * ${addCatPrice}) * ${nightDiscount} 去尾數 ] * ${nights} 晚`;
            //shortSumText = ` ( ${price} + (${totalAddCatCount} * ${addCatPrice}) ) * ${nightDiscount} 去尾數 * ${nights}`;
        } else {
            shortMulaText = ` ( ${roomName}  * 折扣 ) 去尾數 * 共幾晚`;
            shortSumText = ` ${price} * ${nightDiscount} 去尾數 * ${nights}`;
        }

        const summaryHtml = `
        <div class="summary-content-box">
            <p><strong>預訂房型：</strong> <span class="highlight">${roomName}</span></p>
            <p><strong>入住晚數：</strong> ${nights} 晚 <span style="color: #666; font-size: 0.9em;">(${dateStart} ～ ${dateEnd})</span></p>
            <p><strong>入住貓數：</strong> ${cats} 隻</p>
            <p><strong>每晚訂價：</strong> ${price}</p>
            <hr>
            <p>${shortMulaText}</p>
            <p><strong>住宿價錢：</strong> ${shortSumText}</p>
            <p>= ${total.toLocaleString('en-US')}</p>

            <!-- 這裡改為顯示「加購明細」，並將項目一行行排列 -->
            <div class="summary-section-title"><strong>折扣：</strong></div>
            <div class="summary-extras-list">
                ${extrasHtml}
                <div class="summary-extra-price">總計折：${extraTotal.toLocaleString('en-US')}</div>
            </div>
            <p>= ${total.toLocaleString('en-US')} - ${extraTotal.toLocaleString('en-US')} = ${finalTotle}</p>
            <p style="font-size: 24px; color: #d9534f;"><strong>總計金額：$${finalTotle}</strong></p>
        </div>
        `;

        // 執行摺疊動畫
        $('#input-sections').slideUp(400); // 原始三個大區塊向上收合
        $('#btn-container').hide();       // 隱藏計算按鈕
    
        // 動畫完成後顯示灰色 BAR 與 摘要
        $('#restore-bar').slideDown(200);
        $('#summary-section').fadeIn(600); // 摘要區塊淡淡地出現
        $('#summary-content').html(summaryHtml);
    });