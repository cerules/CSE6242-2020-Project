var width = 1800;
var height = 800;
var active = d3.select(null);

var thershold = 0.6;
var maxId = 0;

var idNodeMap = {};
var textToIdMap = {};
var nodes = {};
var linkedByIndex = {};
var links = [];
var nodes_data = [];
var container;
var node, circle, link, labels;
var k = 1, toggle = 0;
var g;
var zoom_handler, svg;
function reset(callback) {
    toggle = 0;
    active.classed("active", false);
    active = d3.select(null);
    let transition = svg.transition().duration(50).call(zoom_handler.transform, d3.zoomIdentity);
    if (callback) {
        transition.on("end", callback);
    }
}
function autocomplete(inp, arr) {
    // the autocomplete function takes two arguments,
    // the text field element and an array of possible autocompleted values:
    var currentFocus;
    // execute a function when someone writes in the text field:
    inp.addEventListener("input", function (e) {
        var a, b, i, val = this.value;
        // close any already open lists of autocompleted values
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        // create a DIV element that will contain the items (values):
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        // append the DIV element as a child of the autocomplete container:
        this.parentNode.appendChild(a);
        // for each item in the array...
        for (i = 0; i < arr.length; i++) {
            // check if the item starts with the same letters as the text field value:
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                // create a DIV element for each matching element:
                b = document.createElement("DIV");
                // make the matching letters bold:
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                // insert a input field that will hold the current array item's value:
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                // execute a function when someone clicks on the item value (DIV element):
                b.addEventListener("click", function (e) {
                    // insert the value for the autocomplete text field:
                    inp.value = this.getElementsByTagName("input")[0].value;
                    // close the list of autocompleted values,
                    // (or any other open lists of autocompleted values:
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    // execute a function presses a key on the keyboard:
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            // If the arrow DOWN key is pressed,
            // increase the currentFocus variable:
            currentFocus++;
            // and and make the current item more visible:
            addActive(x);
        } else if (e.keyCode == 38) { //up
            // If the arrow UP key is pressed,
            // decrease the currentFocus variable:
            currentFocus--;
            // and and make the current item more visible:
            addActive(x);
        } else if (e.keyCode == 13) {
            // If the ENTER key is pressed, prevent the form from being submitted,
            e.preventDefault();
            if (currentFocus > -1) {
                // and simulate a click on the "active" item:
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        // a function to classify an item as "active":
        if (!x) return false;
        // start by removing the "active" class on all items:
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        // add class "autocomplete-active":
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        // a function to remove the "active" class from all autocomplete items:
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        // close all autocomplete lists in the document,
        // except the one passed as an argument:
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    // execute a function when someone clicks in the document:
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function showAlert(text) {
    window.alert(text);
}

function setupAutocompletes() {
    autocomplete(document.getElementById("myInput"), Object.keys(nodes));
    autocomplete(document.getElementById("edgeSource"), Object.keys(nodes));
    autocomplete(document.getElementById("edgeDest"), Object.keys(nodes));
    autocomplete(document.getElementById("nodeEntry"), Object.keys(nodes));
}

//Render the graph
function drawChart() {
    d3.select("svg").remove();
    svg = container.append("svg")
        .attr("width", width + "px")
        .attr("height", height + "px")
        .on("click", stopped, true);

    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#ccc");

    //set up the simulation and add forces  
    var iterations = 0;
    var simulation = d3.forceSimulation()
        .nodes(nodes_data);

    var link_force = d3.forceLink(links)
        .id(function (d) { return d.name; })
        .distance(150);

    var charge_force = d3.forceManyBody()
        // .distanceMin(125)
        .distanceMax(600)
        .strength(-100);

    var center_force = d3.forceCenter(width / 2, height / 2);

    simulation
        .force("charge_force", charge_force)
        .force("center_force", center_force)
        .force("links", link_force)
        ;


    //add tick instructions: 
    simulation.on("tick", tickActions);

    //add encompassing group for the zoom 
    g = svg.append("g")
        .attr("class", "everything");

    //draw lines for the links 
    link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", function (d) {
            return ((d.similarity - thershold) * 10) + 1;
        })
        .style("stroke", "red");

    // function dblclick(d) {
    //     if (d.fixed == true) {
    //         d3.select(this).select("circle")
    //             .style("fill", function (d) { return myColor(myNodeWeight(d)) });
    //         d.fixed = false
    //     } else {
    //         d3.select(this).select("circle")
    //             .style("fill", "red");
    //         d.fixed = true;
    //     }
    // };

    //calculate the radius of each node based on the degree of the node
    function myNodeWeight(d) {
        d.weight = links.filter(function (l) {
            return l.source.index == d.index || l.target.index == d.index
        }).length;

        return 5 + d.weight;
    }

    //use color gradient for nodes based on the degree of the node
    var myColor = d3.scaleSequential()
        .domain([1, 9])
        .interpolator(d3.interpolateWarm);

    //draw circles for the nodes 
    node = g.selectAll(".node")
        .data(nodes_data)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("id", function (d) { return d.name.toLowerCase(); })
        //.on("dblclick", dblclick)
        .on('click', highlightNode);

    // add the nodes
    circle = node.append("circle")
        .attr("r", function (d) {
            return myNodeWeight(d)
        })
        .attr("fill", function (d) {
            return myColor(myNodeWeight(d));
        });



    labels = node.append("text")
        .attr("x", 13)
        .attr("y", 2)
        .text(function (d) { return d.name; })
        .style("font-weight", "800");

    //add drag capabilities  
    var drag_handler = d3.drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end);

    drag_handler(node);

    //Drag functions 
    //d is the node 
    function drag_start(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        simulation.restart();
        iterations = 25;
        highlightNode(d);
        d.fx = d.x;
        d.fy = d.y;
    }

    //make sure you can't drag the circle outside the box
    function drag_drag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function drag_end(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        simulation.restart();
        iterations = 25;
        d.fx = null;
        d.fy = null;
    }

    //add zoom capabilities 
    zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);

    zoom_handler(svg);

    //Zoom functions 
    function zoom_actions() {
        k = d3.event.transform.k;
        g.attr("transform", d3.event.transform);
    }

    function tickActions() {
        if (iterations % 25 === 0 && !document.getElementById("loadingdiv")) {
            var loadingDiv = d3.select("body")
                .append("div")
                .attr("id", "loadingdiv");

            loadingDiv.append("text").text("Loading....");
        }
        iterations++;
        //update circle positions each tick of the simulation 
        circle
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });

        labels
            .attr("x", function (d) { return d.x + 13; })
            .attr("y", function (d) { return d.y + 2; })

        //update link positions 
        link
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        if (iterations > 50) {
            simulation.stop();
            document.getElementById("loadingdiv").remove();
        }
    }

}

function stopped() {
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function flashNode(sel) {
    sel.transition().duration(500).style('opacity', '1');
}

function zoomToNodeByName(name) {
    var zoomCallBack = function () {
        var selected = document.getElementById(name.toLowerCase());
        if (selected === undefined) {
            return;
        }

        var transform = {
            x: width / 2 - k * selected.getBoundingClientRect().x,
            y: height / 2 - k * selected.getBoundingClientRect().y
        };

        g.transition().duration(750)
            .call(zoom_handler.transform,
                d3.zoomIdentity.translate(transform.x, transform.y))
            .on("end", highlightNode(selected));
    }
    reset(zoomCallBack);
}

function highlightNode(d) {
    var name = d.name ? d.name.toLowerCase() : d.id;

    if (toggle == 0) {
        // Ternary operator restyles links and nodes if they are adjacent.
        link.style('stroke-opacity', function (l) {

            var test = l.target == d || l.target.name.toLowerCase() === name;
            test = test || (l.source == d || l.source.name.toLowerCase() === name);
            return test ? 1 : 0.1;
        });
        node.style('opacity', function (n) {
            let n1 = d.name ? d.name.toLowerCase() : d.id;
            let n2 = n.name ? n.name.toLowerCase() : n.id;
            var test = linkedByIndex[n1 + ',' + n2] === 1;
            test = test || linkedByIndex[n2 + ',' + n1] === 1;
            test = test || (n2 === name);
            return test ? 1 : 0.1;
        });
        //d3.select(this).style('opacity', 1);

        var transform = {
            x: width / 2 - k * d.x,
            y: height / 2 - k * d.y
        };
        // g.transition().duration(750)
        //     .call(zoom_handler.transform,
        //         d3.zoomIdentity.translate(transform.x, transform.y));
        toggle = 1;
    }
    else {
        // Restore nodes and links to normal opacity.
        link.style('stroke-opacity', '0.6');
        node.style('opacity', '1');
        //reset();
        toggle = 0;
    }
}
d3.csv("../data/words.csv", function (data) {
    data.forEach(function (d) {
        if (d.word) {
            var temp = d.word.split("|");
            idNodeMap[d.id] = temp[0];
            textToIdMap[temp[0].toLowerCase()] = d.id;
            if (d.id > maxId) {
                maxId = d.id;
            }
        }
    });
    d3.csv("../data/edges.csv", function (data) {
        data.forEach(function (d) {
            var skipFlag = 1;
            for (i = 0; i < links.length; i++) {
                var thisLink = links[i];
                if (thisLink.source == idNodeMap[d.target] && thisLink.target == idNodeMap[d.source]) {
                    skipFlag = 0;
                    break;
                }
            }
            if (skipFlag) {
                var tempdata = { source: idNodeMap[d.source], target: idNodeMap[d.target], similarity: d.similarity };
                links.push(tempdata);
            }
        });

        links.forEach(function (thisLink) {
            thisLink.source = nodes[thisLink.source] ||
                (nodes[thisLink.source] = { name: thisLink.source });
            thisLink.target = nodes[thisLink.target] ||
                (nodes[thisLink.target] = { name: thisLink.target });
        });
        // Make object of all neighboring nodes.
        links.forEach(function (d) {
            let source = d.source.name.toLowerCase();
            let target = d.target.name.toLowerCase();
            linkedByIndex[source + ',' + target] = 1;
            linkedByIndex[target + ',' + source] = 1;
        });

        nodes_data = d3.values(nodes);

        var autocompForm = d3.select("body").append("form")
            .attr("id", "autocompForm")
            .attr("autocomplete", "off")
            .attr("style", "display:block;");
        var autocompDiv = autocompForm.append("div")
            .attr("class", "autocomplete")
            .attr("style", "width:275px;margin:2px");

        var autocompEntry = autocompDiv.append("input")
            .attr("id", "myInput")
            .attr("type", "text")
            .attr("style", "width:250px;display:inline-block;")
            .attr("name", "Words")
            .attr("placeholder", "Words");

        var button = autocompForm.append('input')
            .attr("id", "mybutton")
            .attr('type', 'button')
            .attr('value', 'Search')
            .on('click', function () { searchNodes(); });

        function searchNodes() {
            // var term = document.getElementById('searchTerm').value;
            var term = document.getElementById('myInput').value;
            if (!term) {
                showAlert("Search term may not be blank.");
                return;
            }
            var selected = document.getElementById(term.toLowerCase());
            if (!nodes[term]) {
                showAlert("The word -" + term + "- does not exist.");
                document.getElementById("edgeForm").reset();
                return;
            }
            if (selected === undefined) {
                reset();
                return;
            }

            // var path = d3.selectAll('line');
            // selected.childNodes[0].attr("style",'opacity=0');
            // selected.childNodes[1].attr("style",'opacity=0');
            // node.style('opacity', '1');
            // circle.style('opacity', '1');
            // labels.style('opacity', '1');
            // selected.childNodes[0].style.opacity = 0;
            // selected.childNodes[1].style.opacity = 0;
            // selected.childNodes[1].style.color = "#FF00FF";
            // link.style('stroke-opacity', '0');
            zoomToNodeByName(term);

            document.getElementById("autocompForm").reset();
            // node.transition().duration(2000).style('opacity', '1');
            // circle.transition().duration(1000).style('opacity', '1');
            // labels.transition().duration(1000).style('opacity', '1');
            // link.transition().duration(2000).style('stroke-opacity', '0.6');
        }

        var nodeForm = d3.select("body").append("form")
            .attr("id", "nodeForm")
            .attr("autocomplete", "off")
            .attr("style", "display:block;");
        var nodeDiv = nodeForm.append("div")
            .attr("class", "autocomplete")
            .attr("style", "width:275px;display:inline-block;margin:2px");

        var nodeEntry = nodeDiv.append("input")
            .attr("id", "nodeEntry")
            .attr("type", "text")
            .attr("style", "width:250px;display:inline-block;")
            .attr("name", "Node")
            .attr("placeholder", "Node");

        var nodeAddButton = nodeForm.append('input')
            .attr('type', 'button')
            .attr("id", "mybutton")
            .attr("style", "width:100px;display:inline-block;")
            .attr('value', 'Add Node')
            .on('click', function () { addNode(); });


        function addNode() {
            var source = document.getElementById("nodeEntry").value;
            if (!source) {
                showAlert("Node must have a name.");
                return;
            }
            var sourceLower = source.toLowerCase();

            // validation?
            // add Node
            if (nodes[source]) {
                showAlert("The Node -" + source + "- already exists");
                document.getElementById("nodeForm").reset();
                return;
            }
            else if (textToIdMap[sourceLower]) {
                nodes[source] = { name: source };
                nodes_data.push(nodes[source]);
                showAlert("The Node -" + source + "- has been successfully added");
                // redraw
                drawChart();

                setupAutocompletes();
            }
            else {
                maxId = maxId + 1;
                textToIdMap[sourceLower] = maxId;
                idNodeMap[maxId] = source;
                nodes[source] = { name: source };
                nodes_data.push(nodes[source]);
                showAlert("The Node -" + source + "- has been successfully added");
                // redraw
                drawChart();

                setupAutocompletes();
            }
            // zoom to node
            zoomToNodeByName(source);

            document.getElementById("nodeForm").reset();
        }

        var nodeRemButton = nodeForm.append('input')
            .attr('type', 'button')
            .attr("id", "mybutton")
            .attr("style", "width:125px;display:inline-block;margin-left:25px")
            .attr('value', 'Delete Node')
            .on('click', function () { deleteNode(); });

        function deleteNode() {
            var source = document.getElementById("nodeEntry").value;
            if (!source) {
                showAlert("Node to delete may not be empty.");
                return;
            }
            var sourceLower = source.toLowerCase();
            var Flag = 0;
            // remove Node
            if (nodes[source]) {
                var nodeId = textToIdMap[sourceLower];
                delete textToIdMap[sourceLower];
                delete idNodeMap[nodeId];
                delete nodes[source];
                for (let i = nodes_data.length - 1; i >= 0; i--) {
                    if (nodes_data[i].name.toLowerCase() === sourceLower) {
                        nodes_data.splice(i, 1);
                    }
                }
                //delete the edges associated with the node when you delete it
                for (let i = links.length - 1; i >= 0; i--) {
                    if (links[i].source.name.toLowerCase() === sourceLower
                        || links[i].target.name.toLowerCase() === sourceLower) {

                        linkedByIndex[links[i].source + ',' + links[i].target] = 0;
                        linkedByIndex[links[i].target + ',' + links[i].source] = 0;
                        links.splice(i, 1);
                    }
                }
                // redraw
                drawChart();
                setupAutocompletes();

                showAlert("The Node -" + source + "- has been successfully deleted");
            }
            else {
                showAlert("The Node -" + source + "- does not exist");
            }
            document.getElementById("nodeForm").reset();
        }

        var edgeForm = d3.select("body").append("form")
            .attr("id", "edgeForm")
            .attr("autocomplete", "off")
            .attr("style", "display:block;");
        var edgeDiv = edgeForm.append("div")
            .attr("class", "autocomplete")
            .attr("style", "width:550px;display:inline-block;margin:2px");

        var sourceEntry = edgeDiv.append("input")
            .attr("id", "edgeSource")
            .attr("type", "text")
            .attr("style", "width:250px;display:inline-block;")
            .attr("name", "Source")
            .attr("placeholder", "Source");

        var destEntry = edgeDiv.append("input")
            .attr("id", "edgeDest")
            .attr("type", "text")
            .attr("style", "width:250px;display:inline-block;margin-left:25px")
            .attr("name", "Destination")
            .attr("placeholder", "Destination");

        var edgeButton = edgeForm.append('input')
            .attr('type', 'button')
            .attr("id", "mybutton")
            .attr("style", "width:100px;display:inline-block;")
            .attr('value', 'Add Edge')
            .on('click', function () { addEdge(); });

        function addEdge() {
            var source = document.getElementById("edgeSource").value;
            if (!source) {
                showAlert("Source node may not be blank.");
                return;
            }
            var sourceLower = source.toLowerCase();
            var target = document.getElementById("edgeDest").value;
            if (!target) {
                showAlert("Target node may not be blank.");
                return;
            }
            var targetLower = target.toLowerCase();
            // validation?
            if (!nodes[source] || !nodes[target]) {
                showAlert("Either source or target does not exist.");
                document.getElementById("edgeForm").reset();
                return;
            }
            if (sourceLower === targetLower) {
                showAlert("Source and target node cannot be the same.");
                document.getElementById("edgeForm").reset();
                return;
            }
            if (linkedByIndex[sourceLower + ',' + targetLower] === 1
                || linkedByIndex[targetLower + ',' + sourceLower] === 1) {
                // edge already exists
                showAlert("Edge already exists between " + source + " and " + target);
                document.getElementById("edgeForm").reset();
                return;
            }
            // add edge
            let sourceId = idNodeMap[textToIdMap[sourceLower]];
            let targetId = idNodeMap[textToIdMap[targetLower]];
            let linkdata = {
                "source": nodes[sourceId],
                "target": nodes[targetId],
                "similarity": 0.9999
            };
            links.push(linkdata);
            linkedByIndex[sourceLower + ',' + targetLower] = 1;
            linkedByIndex[targetLower + ',' + sourceLower] = 1;
            // redraw
            drawChart();
            // zoom to node
            zoomToNodeByName(source);
            showAlert("The edge has been successfully added");

            document.getElementById("edgeForm").reset();
        }

        var edgeRemButton = edgeForm.append('input')
            .attr('type', 'button')
            .attr("id", "mybutton")
            .attr("style", "width:125px;display:inline-block;margin-left:25px")
            .attr('value', 'Delete Edge')
            .on('click', function () { deleteEdge(); });
        
        setupAutocompletes();

        function deleteEdge() {
            var source = document.getElementById("edgeSource").value;
            if (!source) {
                showAlert("Source node may not be blank.");
                return;
            }
            var sourceLower = source.toLowerCase();
            var target = document.getElementById("edgeDest").value;
            if (!target) {
                showAlert("Target node may not be blank.");
                return;
            }
            var targetLower = target.toLowerCase();
            // remove edge
            if (!nodes[source] || !nodes[target]) {
                showAlert("Either source or target does not exist.");
                document.getElementById("edgeForm").reset();
                return;
            }
            if (sourceLower === targetLower) {
                showAlert("Source and target node cannot be the same.");
                document.getElementById("edgeForm").reset();
                return;
            }

            if (!linkedByIndex[sourceLower + ',' + targetLower]
                && !linkedByIndex[targetLower + ',' + sourceLower]) {
                // edge doesn't exist
                showAlert("Edge doesn't exist between " + source + " and " + target);
                document.getElementById("edgeForm").reset();
                return;
            }

            for (let i = links.length - 1; i >= 0; i--) {
                if (links[i].source.name.toLowerCase() === sourceLower
                    && links[i].target.name.toLowerCase() === targetLower) {
                    links.splice(i, 1);
                }
                else if (links[i].source.name.toLowerCase() === targetLower
                    && links[i].target.name.toLowerCase() === sourceLower) {
                    links.splice(i, 1);
                }
            }

            linkedByIndex[sourceLower + ',' + targetLower] = 0;
            linkedByIndex[targetLower + ',' + sourceLower] = 0;
            // redraw
            drawChart();
            // zoom to node
            zoomToNodeByName(source);
            showAlert("The edge has been successfully deleted");

            document.getElementById("edgeForm").reset();
        }

        container = d3.select("body").append("div")
            .attr("id", "halfpage");
        drawChart(container);

        var footer = d3.select("body").append("div")
            .attr("id", "footer")
            .attr("align", "left")
            .style('width', "1800px");

        footer.append("text")
            .style('width', '1800px')
            .style('text-align', 'right')
            .text('CSE 6242(Spring2020) -- Team 189 -- (Prashanthi Narayanamangalam, Christopher Roth, Jonathan Storey)');

    });
});
