document.addEventListener('DOMContentLoaded', function(){

    const favoriteElement = document.querySelector('.favorite');

    if('share' in navigator) {
        iosShareIcon = 'M12,1L8,5H11V14H13V5H16M18,23H6C4.89,23 4,22.1 4,21V9A2,2 0 0,1 6,7H9V9H6V21H18V9H15V7H18A2,2 0 0,1 20,9V21A2,2 0 0,1 18,23Z';
        androidShareIcon = 'M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z';
        favoriteElement.insertAdjacentHTML('afterend', /*html*/ `
            <button class="additional-player-stat svg-icon">
                <svg viewBox="0 0 24 24">
                    <title>share</title>
                    <path fill="white" d="${navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i) ? iosShareIcon : androidShareIcon}" />
                </svg>
            </button>
        `);
        favoriteElement.nextElementSibling.addEventListener('click', () => {
            navigator.share({
                text: `Check out ${calculated.display_name} on SkyCrypt`,
                url: window.location.href,
            });
        })
    }

    function setCookie(name,value,days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; SameSite=Lax; path=/";
    }

    function getCookie(c_name) {
        if (document.cookie.length > 0) {
            c_start = document.cookie.indexOf(c_name + "=");
            if (c_start != -1) {
                c_start = c_start + c_name.length + 1;
                c_end = document.cookie.indexOf(";", c_start);
                if (c_end == -1) {
                    c_end = document.cookie.length;
                }
                return unescape(document.cookie.substring(c_start, c_end));
            }
        }
        return "";
    }

    let userAgent = window.navigator.userAgent;
    let tippyInstance;

    tippy('*[data-tippy-content]:not(.interactive-tooltip)', {
        trigger: 'mouseenter click'
    });

    const playerModel = document.getElementById("player_model");

    let skinViewer;

    if(playerModel && calculated.skin_data){
        skinViewer = new skinview3d.SkinViewer({
    		width: playerModel.offsetWidth,
    		height: playerModel.offsetHeight,
    		skin: "/texture/" + calculated.skin_data.skinurl.split("/").pop(),
    		cape: 'capeurl' in calculated.skin_data ? "/texture/" + calculated.skin_data.capeurl.split("/").pop() : "/cape/" + calculated.display_name
        });

        playerModel.appendChild(skinViewer.canvas);

    	skinViewer.camera.position.set(-18, -3, 58);

    	const controls = new skinview3d.createOrbitControls(skinViewer);

        controls.enableZoom = false;
        controls.enablePan = false;

    	skinViewer.animations.add((player, time) => {
            const skin = player.skin;

            // Multiply by animation's natural speed
            time *= 2;

            // Arm swing
            const basicArmRotationZ = Math.PI * 0.02;
            skin.leftArm.rotation.z = Math.cos(time) * 0.03 + basicArmRotationZ;
            skin.rightArm.rotation.z = Math.cos(time + Math.PI) * 0.03 - basicArmRotationZ;

            // Always add an angle for cape around the x axis
            const basicCapeRotationX = Math.PI * 0.06;
            player.cape.rotation.x = Math.sin(time) * 0.01 + basicCapeRotationX;
        });
    }

    tippyInstance = tippy('.interactive-tooltip', {
        trigger: 'mouseenter click',
        interactive: true,
        appendTo: () => document.body,
        onTrigger(instance, event){
            if(event.type == 'click')
                dimmer.classList.add('show-dimmer');
        },
        onHide(){
            dimmer.classList.remove('show-dimmer');
        }
    });

    const all_items = items.armor.concat(items.inventory, items.enderchest, items.talisman_bag, items.fishing_bag, items.quiver, items.potion_bag, items.personal_vault, items.wardrobe_inventory);

    let dimmer = document.querySelector("#dimmer");

    let inventoryContainer = document.querySelector('#inventory_container');

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.delete('__cf_chl_jschl_tk__');
    urlParams.delete('__cf_chl_captcha_tk__');

    const urlParamsString = urlParams.toString().length > 0 ? '?' + urlParams.toString() : '';

    if(calculated.profile.cute_name == 'Deleted')
        history.replaceState({}, document.title, '/stats/' + calculated.display_name + '/' + calculated.profile.profile_id + urlParamsString);
    else
        history.replaceState({}, document.title, '/stats/' + calculated.display_name + '/' + calculated.profile.cute_name + urlParamsString);

    function isEnchanted(item){
        if(item.animated)
            return false;

        if(item.id == 399)
            return true;

        if('texture_path' in item && item.texture_path.endsWith('.gif')) // disable enchanted overlay for gifs cause laggy
            return false;

        if('id' in item && [403, 384].includes(item.id))
            return true;

        if('tag' in item && Array.isArray(item.tag.ench))
            return true;

        return false;
    };

    function renderLore(text){
        let output = "";
        let spansOpened = 0;

        if (!text.startsWith("§")) {
            text = `§7${text}`
        }

        const parts = text.split("§");

        if(parts.length == 1)
            return text;

        for(const part of parts){
            const code = part.substring(0, 1);
            const content = part.substring(1);

            const format = constants.minecraft_formatting[code];

            if(format === undefined)
                continue;

            if(format.type == 'color'){
                for(; spansOpened > 0; spansOpened--)
                    output += "</span>";

                output += `<span style='${format.css}'>${content}`;

                spansOpened++;
            }else if(format.type == 'format'){
                output += `<span style='${format.css}'>${content}`;

                spansOpened++;
            }else if(format.type == 'reset'){
                for(; spansOpened > 0; spansOpened--)
                    output += "</span>";

                output += content;
            }
        }

        for(; spansOpened > 0; spansOpened--)
            output += "</span>";

        const specialColor = constants.minecraft_formatting['6'];

        const matchingEnchants = constants.special_enchants.filter(a => output.includes(a));

        for(const enchantment of matchingEnchants)
            output = output.replace(enchantment, `<span style='${specialColor.css}'>${enchantment}</span>`);

        return output;
    }

    let currentBackpack;

    function renderInventory(inventory, type){
        let scrollTop = window.pageYOffset;

        let visibleInventory = document.querySelector('.inventory-view.current-inventory');

        if(visibleInventory){
            visibleInventory.classList.remove('current-inventory');
            document.querySelector('#inventory_container').removeChild(visibleInventory);
        }

        let inventoryView = document.createElement('div');
        inventoryView.className = 'inventory-view current-inventory processed';
        inventoryView.setAttribute('data-inventory-type', type);

        let countSlotsUsed = 0;

        inventory.forEach(function(item){
            if(Object.keys(item).length > 2)
                countSlotsUsed++;
        });

        countSlotsUsed = Math.max(countSlotsUsed, 9);

        switch(type){
            case 'inventory':
                inventory = inventory.slice(9, 36).concat(inventory.slice(0, 9));
                break;
            case 'enderchest':
            case 'personal_vault':
                break;
            default:
                if(type in calculated.bag_sizes)
                    inventory = inventory.slice(0, Math.max(countSlotsUsed - 1, calculated.bag_sizes[type]));
        }

        inventory.forEach(function(item, index){
            let inventorySlot = document.createElement('div');
            inventorySlot.className = 'inventory-slot';

            if(item.id){
                let inventoryItemIcon = document.createElement('div');
                let inventoryItemCount = document.createElement('div');

                inventoryItemIcon.className = 'piece-icon item-icon icon-' + item.id + '_' + item.Damage;

                if(item.texture_path){
                    inventoryItemIcon.className += ' custom-icon';
                    inventoryItemIcon.style.backgroundImage = 'url("' +  item.texture_path + '")';
                }

                if(isEnchanted(item))
                    inventoryItemIcon.classList.add('is-enchanted');

                inventoryItemCount.className = 'item-count';
                inventoryItemCount.innerHTML = item.Count;

                let inventoryItem = document.createElement('div');

                let pieceHoverArea = document.createElement('div');
                pieceHoverArea.className = 'piece-hover-area';

                inventoryItem.className = 'rich-item inventory-item';

                if(type == 'backpack')
                    inventoryItem.setAttribute('data-backpack-item-index', index);
                else
                    inventoryItem.setAttribute('data-item-index', item.item_index);

                inventoryItem.appendChild(inventoryItemIcon);
                inventoryItem.appendChild(pieceHoverArea);

                if(item.Count != 1)
                    inventoryItem.appendChild(inventoryItemCount);

                inventorySlot.appendChild(inventoryItem);

                bindLoreEvents(pieceHoverArea);
            }

            inventoryView.appendChild(inventorySlot);

            inventoryView.appendChild(document.createTextNode(" "));

            if((index + 1) % 9 == 0)
                inventoryView.appendChild(document.createElement("br"));

            if((index + 1) % 27 == 0 && type == 'inventory')
                inventoryView.appendChild(document.createElement("br"));
        });

        inventoryContainer.appendChild(inventoryView);

        [].forEach.call(inventoryView.querySelectorAll('.item-icon.is-enchanted'), handleEnchanted);

        window.scrollTo({
            top: scrollTop
        });

        let inventoryStatContainer = document.querySelector('.stat-inventory');

        let rect = inventoryStatContainer.getBoundingClientRect();

        if(rect.top < 0 || rect.bottom > window.innerHeight)
            inventoryStatContainer.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function showBackpack(item){
        let activeInventory = document.querySelector('.inventory-tab.active-inventory');

        if(activeInventory)
            activeInventory.classList.remove('active-inventory');

        renderInventory(item.containsItems, 'backpack');

        currentBackpack = item;
    }

    function fillLore(element){
        let item = [];

        if(element.hasAttribute('data-backpack-index')){
            let backpack = all_items.filter(a => a.item_index == Number(element.getAttribute('data-backpack-index')));

            if(backpack.length == 0)
                return;

            backpack = backpack[0];

            item = backpack.containsItems.filter(a => a.item_index == Number(element.getAttribute('data-item-index')));
        }else if(element.hasAttribute('data-item-index'))
            item = all_items.filter(a => a.item_index == Number(element.getAttribute('data-item-index')));
        else if(element.hasAttribute('data-backpack-item-index'))
            item = [currentBackpack.containsItems[Number(element.getAttribute('data-backpack-item-index'))]];
        else if(element.hasAttribute('data-pet-index'))
            item = [calculated.pets[parseInt(element.getAttribute('data-pet-index'))]];
        else if(element.hasAttribute('data-missing-pet-index'))
            item = [calculated.missingPets[parseInt(element.getAttribute('data-missing-pet-index'))]];
        else if(element.hasAttribute('data-missing-talisman-index'))
            item = [calculated.missingTalismans[parseInt(element.getAttribute('data-missing-talisman-index'))]];

        if(item.length == 0)
            return;

        item = item[0];

        if(element.hasAttribute('data-item-index'))
            statsContent.setAttribute("data-item-index", item.item_index);
        else if(element.hasAttribute('data-backpack-item-index'))
            statsContent.setAttribute("data-backpack-item-index", element.getAttribute('data-backpack-item-index'));
        else if(element.hasAttribute('data-pet-index'))
            statsContent.setAttribute("data-backpack-item-index", element.getAttribute('data-pet-index'));

        itemName.className = 'item-name ' + 'piece-' + (item.rarity || 'common') + '-bg';
        itemNameContent.innerHTML = item.display_name || 'null';

        if(element.hasAttribute('data-pet-index'))
            itemNameContent.innerHTML = `[Lvl ${item.level.level}] ${item.display_name}`;

        if(item.texture_path){
            itemIcon.style.backgroundImage = 'url("' + item.texture_path + '")';
            itemIcon.className = 'stats-piece-icon item-icon custom-icon';
        }else{
            itemIcon.removeAttribute('style');
            itemIcon.classList.remove('custom-icon');
            itemIcon.className = 'stats-piece-icon item-icon icon-' + item.id + '_' + item.Damage;
        }

        /* broken sometimes
        if(isEnchanted(item))
            handleEnchanted(itemIcon);
            */

        itemLore.innerHTML = item.lore || '';

        try{
            if(item.lore != null)
                throw null;

            item.tag.display.Lore.forEach(function(line, index){
                itemLore.innerHTML += renderLore(line);

                if(index + 1 < item.tag.display.Lore.length)
                    itemLore.innerHTML += '<br>';
            });
        }catch(e){

        }

        if(item.texture_pack){
            const texturePack = extra.packs.filter(a => a.id == item.texture_pack)[0];

            let packContent = document.createElement('div');
            packContent.classList.add('pack-credit');

            let packIcon = document.createElement('img');
            packIcon.setAttribute('src', item.texture_pack.base_path + '/pack.png');
            packIcon.classList.add('pack-icon');

            let packName = document.createElement('a');
            packName.setAttribute('href', item.texture_pack.url);
            packName.setAttribute('target', '_blank');
            packName.classList.add('pack-name');
            packName.innerHTML = item.texture_pack.name;

            let packAuthor = document.createElement('div');
            packAuthor.classList.add('pack-author');
            packAuthor.innerHTML = 'by <span>' + item.texture_pack.author + '</span>';

            packContent.appendChild(packIcon);
            packContent.appendChild(packName);
            packContent.appendChild(packAuthor);

            itemLore.appendChild(document.createElement('br'));

            itemLore.appendChild(packContent);
        }

        backpackContents.innerHTML = '';

        if(Array.isArray(item.containsItems)){
            backpackContents.classList.add('contains-backpack');

            item.containsItems.forEach((backpackItem, index) => {
                let inventorySlot = document.createElement('div');
                inventorySlot.className = 'inventory-slot backpack-slot';

                if(backpackItem.id){
                    let inventoryItemIcon = document.createElement('div');
                    let inventoryItemCount = document.createElement('div');

                    let enchantedClass = isEnchanted(backpackItem) ? 'is-enchanted' : '';

                    inventoryItemIcon.className = 'piece-icon item-icon ' + enchantedClass + ' icon-' + backpackItem.id + '_' + backpackItem.Damage;

                    if(backpackItem.texture_path){
                        inventoryItemIcon.className += ' custom-icon';
                        inventoryItemIcon.style.backgroundImage = 'url("' + backpackItem.texture_path + '")';
                    }

                    inventoryItemCount.className = 'item-count';
                    inventoryItemCount.innerHTML = backpackItem.Count;

                    let inventoryItem = document.createElement('div');

                    inventoryItem.className = 'inventory-item';

                    inventoryItem.appendChild(inventoryItemIcon);

                    if(backpackItem.Count > 1)
                        inventoryItem.appendChild(inventoryItemCount);

                    inventorySlot.appendChild(inventoryItem);
                }

                backpackContents.appendChild(inventorySlot);

                backpackContents.appendChild(document.createTextNode(" "));

                if((index + 1) % 9 == 0)
                    backpackContents.appendChild(document.createElement("br"));
            });

            [].forEach.call(document.querySelectorAll('.contains-backpack .item-icon.is-enchanted'), handleEnchanted);

            let viewBackpack = document.createElement('div');
            viewBackpack.classList = 'view-backpack';

            let viewBackpackText = document.createElement('div');
            viewBackpackText.innerHTML = '<span>View Backpack</span><br><span>(Right click backpack to immediately open)</span>';

            viewBackpack.appendChild(viewBackpackText);

            viewBackpack.addEventListener('click', function(){
                showBackpack(item);
                closeLore();
            });

            backpackContents.appendChild(viewBackpack);
        }else{
            backpackContents.classList.remove('contains-backpack');
        }
    }

    function showLore(element, _resize){
        statsContent.classList.add('sticky-stats');
        element.classList.add('sticky-stats');
        dimmer.classList.add('show-dimmer');

        if(_resize != false)
            resize();
    }

    function closeLore(){
        let shownLore = document.querySelector('#stats_content.show-stats, #stats_content.sticky-stats');

        if(shownLore != null){
            dimmer.classList.remove('show-dimmer');

            let stickyStatsPiece = document.querySelector('.rich-item.sticky-stats');

            if(stickyStatsPiece != null){
                stickyStatsPiece.blur();
                stickyStatsPiece.classList.remove('sticky-stats');
            }

            statsContent.classList.remove('sticky-stats', 'show-stats');
        }

        const openedWardrobe = document.querySelector('.wardrobe-opened');

        if(openedWardrobe)
            openedWardrobe.classList.remove('wardrobe-opened');
    }

    let oldWidth = null;
    let oldheight = null;

    function resize(){
        if (playerModel) {
            if(window.innerWidth <= 1570 && (oldWidth === null || oldWidth > 1570))
                document.getElementById("skin_display_mobile").appendChild(playerModel);

            if(window.innerWidth > 1570 && oldWidth <= 1570)
                document.getElementById("skin_display").appendChild(playerModel);
        }

        tippy('*[data-tippy-content]');

        if(playerModel && skinViewer){
            if(playerModel.offsetWidth / playerModel.offsetHeight < 0.6)
                skinViewer.setSize(playerModel.offsetWidth, playerModel.offsetWidth * 2);
            else
                skinViewer.setSize(playerModel.offsetHeight / 2, playerModel.offsetHeight);
        }

        updateStatsPositions();

        let element = document.querySelector('.rich-item.sticky-stats');

        if(element == null)
            return;

        let maxTop = window.innerHeight - statsContent.offsetHeight - 20;
        let rect = element.getBoundingClientRect();

        if(rect.x)
            statsContent.style.left = rect.x - statsContent.offsetWidth - 10 + "px";

        if(rect.y)
            statsContent.style.top = Math.max(70, Math.min(maxTop, (rect.y + element.offsetHeight / 2) - statsContent.offsetHeight / 2)) + 'px';

        oldWidth = window.innerWidth;
        oldHeight = window.innerHeight;
    }

    [].forEach.call(document.querySelectorAll('.sub-extendable .stat-sub-header'), function(element){
        element.addEventListener('click', function(e){
            if(element.parentNode.classList.contains('sub-extended'))
                element.parentNode.classList.remove('sub-extended')
            else
                element.parentNode.classList.add('sub-extended');
        });
    });

    [].forEach.call(document.querySelectorAll('.sub-floor-extendable .stat-sub-header'), function(element){
        element.addEventListener('click', function(e){
            if(element.parentNode.classList.contains('sub-extended'))
                element.parentNode.classList.remove('sub-extended')
            else
                element.parentNode.classList.add('sub-extended');
        });
    });

    [].forEach.call(document.querySelectorAll('.stat-weapons .select-weapon'), function(element){
        let itemId = element.parentNode.getAttribute('data-item-id');
        let filterItems;

        if(element.parentNode.hasAttribute('data-backpack-index')){
            let backpack = all_items.filter(a => a.item_index == Number(element.parentNode.getAttribute('data-backpack-index')));

            if(backpack.length == 0)
                return;

            filterItems = backpack[0].containsItems;
        }else{
             filterItems = items.weapons.filter(a => !('backpackIndex' in a));
        }

        let item = filterItems.filter(a => a.itemId == itemId)[0];

        let weaponStats = calculated.weapon_stats[itemId];
        let stats;

        element.addEventListener('mousedown', function(e){
            e.preventDefault();
        });

        element.addEventListener('click', function(e){
            if(element.parentNode.classList.contains('piece-selected')){
                element.parentNode.classList.remove("piece-selected");

                stats = calculated.stats;

                document.querySelector('.stat-active-weapon').className = 'stat-value stat-active-weapon piece-common-fg';
                document.querySelector('.stat-active-weapon').innerHTML = 'None';
            }else{
                [].forEach.call(document.querySelectorAll('.stat-weapons .piece'), function(_element){
                    _element.classList.remove("piece-selected");
                });

                element.parentNode.classList.add("piece-selected");

                document.querySelector('.stat-active-weapon').className = 'stat-value stat-active-weapon piece-' + item.rarity + '-fg';
                document.querySelector('.stat-active-weapon').innerHTML = item.display_name;

                stats = weaponStats;
            }

            anime({
                targets: '.stat-active-weapon',
                backgroundColor: ['rgba(255,255,255,1)', 'rgba(255,255,255,0)'],
                duration: 500,
                round: 1,
                easing: 'easeOutCubic'
            });

            for(let stat in stats){
                if(stat == 'sea_creature_chance')
                    continue;

                let element = document.querySelector('.basic-stat[data-stat=' + stat + '] .stat-value');

                if(!element)
                    continue;

                let currentValue = parseInt(element.innerHTML);
                let newValue = stats[stat];

                if(newValue != currentValue){
                    anime({
                        targets: '.basic-stat[data-stat=' + stat + '] .stat-value',
                        innerHTML: newValue,
                        backgroundColor: ['rgba(255,255,255,1)', 'rgba(255,255,255,0)'],
                        duration: 500,
                        round: 1,
                        easing: 'easeOutCubic'
                    });
                }
            }
        });
    });

    [].forEach.call(document.querySelectorAll('.stat-fishing .select-rod'), function(element){
        let itemId = element.parentNode.getAttribute('data-item-id');
        let filterItems;

        if(element.parentNode.hasAttribute('data-backpack-index')){
            let backpack = all_items.filter(a => a.item_index == Number(element.parentNode.getAttribute('data-backpack-index')));

            if(backpack.length == 0)
                return;

            filterItems = backpack[0].containsItems;
        }else{
             filterItems = items.rods.filter(a => !('backpackIndex' in a));
        }

        let item = filterItems.filter(a => a.itemId == itemId)[0];

        let weaponStats = calculated.weapon_stats[itemId];
        let stats;

        element.addEventListener('mousedown', function(e){
            e.preventDefault();
        });

        element.addEventListener('click', function(e){
            if(element.parentNode.classList.contains('piece-selected')){
                element.parentNode.classList.remove("piece-selected");

                stats = calculated.stats;

                document.querySelector('.stat-active-rod').className = 'stat-value stat-active-rod piece-common-fg';
                document.querySelector('.stat-active-rod').innerHTML = 'None';
            }else{
                [].forEach.call(document.querySelectorAll('.stat-fishing .piece'), function(_element){
                    _element.classList.remove("piece-selected");
                });

                element.parentNode.classList.add("piece-selected");

                document.querySelector('.stat-active-rod').className = 'stat-value stat-active-rod piece-' + item.rarity + '-fg';
                document.querySelector('.stat-active-rod').innerHTML = item.display_name;

                stats = weaponStats;
            }

            anime({
                targets: '.stat-active-rod',
                backgroundColor: ['rgba(255,255,255,1)', 'rgba(255,255,255,0)'],
                duration: 500,
                round: 1,
                easing: 'easeOutCubic'
            });

            let _element = document.querySelector('.basic-stat[data-stat=sea_creature_chance] .stat-value');

            if(!_element)
                return;

            let currentValue = parseInt(_element.innerHTML);
            let newValue = stats['sea_creature_chance'];

            if(newValue != currentValue){
                anime({
                    targets: '.basic-stat[data-stat=sea_creature_chance] .stat-value',
                    innerHTML: newValue,
                    backgroundColor: ['rgba(255,255,255,1)', 'rgba(255,255,255,0)'],
                    duration: 500,
                    round: 1,
                    easing: 'easeOutCubic'
                });
            }
        });
    });

    function getPart(src, x, y, width, height){
        let dst = document.createElement('canvas');
        dst.width = width;
        dst.height = height;

        let ctx = dst.getContext("2d");

        // don't blur on resize
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(src, x, y, width, height, 0, 0, (width - src.width) / 2 + width, (height - src.height) / 2 + height);
        return dst;
    }

    function handleEnchanted(element){
        let size = 128;

        let canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        canvas.className = 'enchanted-overlay';

        let ctx = canvas.getContext('2d');

        let src = window.getComputedStyle(element).backgroundImage.split('("').pop().split('")')[0];
        let image = new Image(128, src.includes('/head/') ? 118 : 128);

        if(src.endsWith('.gif'))
            return false;

        image.onload = function(){
            if(!element.classList.contains('custom-icon')){
                let position = window.getComputedStyle(element).backgroundPosition.split(" ");
                let x = Math.abs(parseInt(position[0]));
                let y = Math.abs(parseInt(position[1]));
                image = getPart(image, x, y, size, size);
            }

            ctx.globalAlpha = 1;

            ctx.drawImage(image, 0, 128 / 2 - image.height / 2);

            ctx.globalAlpha = 0.5;
            ctx.globalCompositeOperation = 'source-atop';

            ctx.drawImage(enchantedGlint, 0, 0, canvas.width, canvas.height);

            element.style.backgroundImage = 'url(' + canvas.toDataURL('image/png') + ')';
            element.classList.add('custom-icon');
        };

        image.src = src;
    }

    let enchantedGlint = new Image(128, 128);

    enchantedGlint.onload = function(){
        [].forEach.call(document.querySelectorAll('.item-icon.is-enchanted'), handleEnchanted);
    }

    enchantedGlint.src = '/resources/img/glint.png';

    [].forEach.call(document.querySelectorAll('.inventory-tab'), function(element){
        let type = element.getAttribute('data-inventory-type');

        element.addEventListener('click', function(){
            if(element.classList.contains('active-inventory'))
                return;

            let activeInventory = document.querySelector('.inventory-tab.active-inventory');

            if(activeInventory)
                activeInventory.classList.remove('active-inventory');

            element.classList.add('active-inventory');

            renderInventory(items[type], type);
        });
    });

    const statsContent = document.querySelector('#stats_content');
    const itemName = statsContent.querySelector('.item-name');
    const itemIcon = itemName.querySelector('div:first-child');
    const itemNameContent = itemName.querySelector('span');
    const itemLore = statsContent.querySelector('.item-lore');
    const backpackContents = statsContent.querySelector('.backpack-contents');

    const touchDevice = window.matchMedia("(pointer: coarse)").matches;

    function bindWardrobeEvents(element){
        element.addEventListener('click', function(e){
            const currentWardrobe = document.querySelector('.wardrobe-opened');

            if(currentWardrobe)
                currentWardrobe.classList.remove('wardrobe-opened');

            element.classList.add('wardrobe-opened');
        });
    }

    function bindLoreEvents(element){
        element.addEventListener('mouseenter', function(e){
            fillLore(element.parentNode, false);

            if(touchDevice && element.parentNode.classList.contains('wardrobe-piece') && !element.parentNode.parentNode.classList.contains('wardrobe-opened'))
                return;

            statsContent.classList.add('show-stats');
        });

        element.addEventListener('mouseleave', function(e){
            statsContent.classList.remove('show-stats');
            element.classList.remove('piece-hovered');
        });

        element.addEventListener('mousemove', function(e){
            if(statsContent.classList.contains('sticky-stats'))
                return;

            let maxTop = window.innerHeight - statsContent.offsetHeight - 20;
            let rect = element.getBoundingClientRect();

            let left = rect.x - statsContent.offsetWidth - 10;

            if(left < 10)
                left = rect.x + 90;

            if(rect.x)
                statsContent.style.left = left + 'px';

            let top = Math.max(70, Math.min(maxTop, e.clientY - statsContent.offsetHeight / 2));

            statsContent.style.top = top + "px";
        });

        const itemIndex = Number(element.parentNode.getAttribute('data-item-index'));
        let item = all_items.filter(a => a.item_index == itemIndex);

        if(item.length > 0)
            item = item[0];

        if(item && Array.isArray(item.containsItems)){
            element.parentNode.addEventListener('contextmenu', function(e){
                e.preventDefault();

                showBackpack(item);
                closeLore();
            });
        }

        element.addEventListener('click', function(e){
            if(touchDevice && element.parentNode.classList.contains('wardrobe-piece') && !element.parentNode.parentNode.classList.contains('wardrobe-opened')){
                element.parentNode.blur();
                return;
            }

            if(element.parentNode.parentNode.classList.contains('wardrobe-set'))
                element.parentNode.parentNode.classList.add('wardrobe-opened');

            if(e.ctrlKey && item && Array.isArray(item.containsItems)){
                showBackpack(item);
                closeLore();
            }else{
                if(statsContent.classList.contains('sticky-stats')){
                    closeLore();
                }else{
                    showLore(element.parentNode, false);

                    if(Number(statsContent.getAttribute('data-item-index')) != itemIndex)
                        fillLore(element.parentNode);
                }
            }
        });
    }

    if(touchDevice)
        [].forEach.call(document.querySelectorAll('.wardrobe-set'), bindWardrobeEvents);

    [].forEach.call(document.querySelectorAll('.rich-item .piece-hover-area'), bindLoreEvents);

    let enableApiPlayer = document.querySelector('#enable_api');

    [].forEach.call(document.querySelectorAll('.enable-api'), function(element){
        element.addEventListener('click', function(e){
            e.preventDefault();
            dimmer.classList.add('show-dimmer');
            enableApiPlayer.classList.add('show');

            enableApiPlayer.currentTime = 0;
            enableApiPlayer.play();
        });
    });

    enableApiPlayer.addEventListener('click', function(){
        if(enableApiPlayer.paused)
            enableApiPlayer.play();
        else
            enableApiPlayer.pause();
    });

    dimmer.addEventListener('click', function(e){
        dimmer.classList.remove('show-dimmer');
        enableApiPlayer.classList.remove('show');

        closeLore();
    });

    [].forEach.call(document.querySelectorAll('.close-lore'), function(element){
        element.addEventListener('click', closeLore);
    });

    [].forEach.call(document.querySelectorAll('.copy-text'), function(e){
        let element = e;

        let copyNotification = tippy(element, {
          content: 'Copied to clipboard!',
          trigger: 'manual'
        });

        element.addEventListener('click', function(){
            navigator.clipboard.writeText(element.getAttribute("data-copy-text")).then(function(){
                copyNotification.show();

                setTimeout(function(){
                    copyNotification.hide();
                }, 1500);
            }, function(){});
        });
    });

    function parseFavorites(cookie) {
        return cookie?.split(',').filter(uuid => /^[0-9a-f]{32}$/.test(uuid)) || [];
    }

    function checkFavorite() {
        const favorited = parseFavorites(getCookie("favorite")).includes(favoriteElement.getAttribute("data-username"));
        favoriteElement.setAttribute('aria-checked', favorited);
        return favorited;
    }

    let favoriteNotification = tippy(favoriteElement, {
        trigger: 'manual'
    });

    favoriteElement.addEventListener('click', function(){
        let uuid = favoriteElement.getAttribute("data-username");
        if(uuid == "0c0b857f415943248f772164bf76795c"){
            favoriteNotification.setContent("No");
        }else{
            let cookieArray = parseFavorites(getCookie("favorite"));
            if(cookieArray.includes(uuid)){
                cookieArray.splice(cookieArray.indexOf(uuid), 1);

                favoriteNotification.setContent("Removed favorite!");
            }else if(cookieArray.length >= constants.max_favorites){
                favoriteNotification.setContent(`You can only have ${constants.max_favorites} favorites!`);
            }else{
                cookieArray.push(uuid);

                favoriteNotification.setContent("Added favorite!");
            }
            setCookie("favorite", cookieArray.join(','), 365);
            checkFavorite();
        }
        favoriteNotification.show();

        setTimeout(function(){
            favoriteNotification.hide();
        }, 1500);
    });

    let socialsShown = false;
    let revealSocials = document.querySelector('#reveal_socials');

    if(revealSocials){
        revealSocials.addEventListener('click', function(){
            if(socialsShown){
                socialsShown = false;
                document.querySelector('#additional_socials').classList.remove('socials-shown');
                document.querySelector('#reveal_socials').classList.remove('socials-shown');
            }else{
                socialsShown = true;
                document.querySelector('#additional_socials').classList.add('socials-shown');
                document.querySelector('#reveal_socials').classList.add('socials-shown');
            }
        });
    }

    let statContainers = document.querySelectorAll('.stat-container[data-stat]');
    let wrapperHeight = document.querySelector('#wrapper').offsetHeight;

    let positionY = {};

    function updateStatsPositions(){
        [].forEach.call(statContainers, function(statContainer){
            positionY[statContainer.getAttribute('data-stat')] = statContainer.offsetTop;
        });
    }

    updateStatsPositions();

    let updateTab = false;
    let updateTabLock = false;

    function updateActiveTab(){
        if(!updateTab)
            return false;

        let rectYs = [];
        let activeIndex = 0;
        let activeY = -Infinity;
        let activeStatContainer;

        if((window.innerHeight + window.scrollY) >= wrapperHeight){
            activeStatContainer = [].slice.call(statContainers).pop();
        }else{
            [].forEach.call(statContainers, function(statContainer){
                rectYs.push(statContainer.getBoundingClientRect().y);
            });

            rectYs.forEach(function(rectY, index){
                if(rectY < 250 && rectY > activeY){
                    activeY = rectY;
                    activeIndex = index;
                }
            });

            activeStatContainer = statContainers[activeIndex];
        }

        let activeTab = document.querySelector('.nav-item[data-target=' + activeStatContainer.getAttribute('data-stat') + ']');

        if(!activeTab.classList.contains('active')){
            [].forEach.call(document.querySelectorAll('.nav-item.active'), function(statContainer){
                statContainer.classList.remove('active');
            });

            anime({
                targets: '#nav_items_container',
                scrollLeft: activeTab.offsetLeft - window.innerWidth / 2 + activeTab.offsetWidth / 2,
                duration: 350,
                easing: 'easeOutCubic'
            });

            activeTab.classList.add('active');
        }

        updateTab = false;
    }

    setInterval(updateActiveTab, 100);

    document.addEventListener('scroll', function(){
        if(!updateTabLock)
            updateTab = true;
    });

    updateTab = true;

    [].forEach.call(document.querySelectorAll('.nav-item'), function(element){
        element.addEventListener('click', function(){
            updateTabLock = true;
            updateTab = false;

            let newActiveTab = this;

            [].forEach.call(document.querySelectorAll('.nav-item.active'), function(statContainer){
                statContainer.classList.remove('active');
            });

            anime({
                targets: window.document.scrollingElement || window.document.body || window.document.documentElement,
                scrollTop: positionY[newActiveTab.getAttribute('data-target')] - 60,
                duration: 350,
                easing: 'easeOutCubic',
                complete: function(){
                    updateTabLock = false;
                    newActiveTab.classList.add('active');
                }
            });

            anime({
                targets: '#nav_items_container',
                scrollLeft: newActiveTab.offsetLeft - window.innerWidth / 2 + newActiveTab.offsetWidth / 2,
                duration: 350,
                easing: 'easeOutCubic'
            });
        });
    });

    let otherSkills = document.querySelector('#other_skills');
    let showSkills = document.querySelector("#show_skills");

    if(showSkills != null){
        showSkills.addEventListener('click', function(){
            if(otherSkills.classList.contains('show-skills')){
                otherSkills.classList.remove('show-skills');
                showSkills.innerHTML = 'Show Skills';
            }else{
                otherSkills.classList.add('show-skills');
                show_skills.innerHTML = 'Hide Skills';
            }

            updateStatsPositions();
        });
    }

    [].forEach.call(document.querySelectorAll('.xp-skill'), function(element){
        let skillProgressText = element.querySelector('.skill-progress-text');

        if(skillProgressText === null)
            return;

        let originalText = skillProgressText.innerHTML;

        element.addEventListener('mouseenter', function(){
            skillProgressText.innerHTML = skillProgressText.getAttribute('data-hover-text');
        });

        element.addEventListener('mouseleave', function(){
            skillProgressText.innerHTML = originalText;
        });
    });

    [].forEach.call(document.querySelectorAll('.kills-deaths-container .show-all.enabled'), function(element){
        let parent = element.parentNode;
        let kills = calculated[element.getAttribute('data-type')];

        element.addEventListener('click', function(){
            parent.style.maxHeight = parent.offsetHeight + 'px';
            parent.classList.add('all-shown');
            element.remove();

            kills.slice(10).forEach(function(kill, index){
                let killElement = document.createElement('div');
                let killRank = document.createElement('div');
                let killEntity = document.createElement('div');
                let killAmount = document.createElement('div');
                let statSeparator = document.createElement('div');

                killElement.className = 'kill-stat';
                killRank.className = 'kill-rank';
                killEntity.className = 'kill-entity';
                killAmount.className = 'kill-amount';
                statSeparator.className = 'stat-separator';

                killRank.innerHTML = '#' + (index + 11) + '&nbsp;';
                killEntity.innerHTML = kill.entityName;
                killAmount.innerHTML = kill.amount.toLocaleString();
                statSeparator.innerHTML = ':&nbsp;';

                killElement.appendChild(killRank);
                killElement.appendChild(killEntity);
                killElement.appendChild(statSeparator);
                killElement.appendChild(killAmount);

                parent.appendChild(killElement);
            });
        });
    });

    window.addEventListener('keydown', function(e){
        let selectedPiece = document.querySelector('.rich-item:focus');

        if(selectedPiece !== null && e.keyCode == 13){
            fillLore(selectedPiece);
            showLore(selectedPiece);
        }

        if(e.keyCode == 27){
            dimmer.classList.remove('show-dimmer');
            enableApiPlayer.classList.remove('show');
            if(document.querySelector('#stats_content.sticky-stats') != null){
                closeLore();
            }
        }

        if(document.querySelector('.rich-item.sticky-stats') != null && e.keyCode == 9)
            e.preventDefault();
    });

    resize();

    window.addEventListener('resize', resize);

    const navBar = document.querySelector('#nav_bar')
    function onScroll() {
        if(navBar.getBoundingClientRect().top <= 48) {
            navBar.classList.add('stuck')
        } else {
            navBar.classList.remove('stuck')
        }
    }
    onScroll();
    window.addEventListener('scroll', onScroll);

    setTimeout(resize, 1000);
});
