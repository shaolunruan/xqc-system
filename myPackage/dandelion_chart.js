import * as d3 from 'd3'
import {colorMap_circle_fill, colorMap_circle_border, colorMap_point} from "./view1_colorScheme";
import {state_color_fill, state_color_border, state_color_point} from "./color_scheme";


function dandelion_chart(state_vectors_, states, bundle_g_, size_arr_, position_arr_, theta_){


    ////////////////////////// 检查参数 ////////////////////////////////

    // // 判断 svg 是否真实存在
    // if(typeof svg_element !== 'object'){
    //     console.log('Dandelion chart svg not valid')
    //
    //     return
    // }else if(svg_element.attr('class') !== 'view_svg'){
    //     console.log('Dandelion chart parameter `svg` not valid')
    //
    //     return
    // }



    // 判断 size_arr_, position_arr_ 是否合法
    if(typeof state_vectors_ !== 'object' || state_vectors_.length !== 4){
        console.log('Dandelion chart parameter `states` not valid')

        return
    }



    // 判断 size_arr_, position_arr_ 是否合法
    if(typeof size_arr_ !== 'object' || size_arr_.length !== 2){
        console.log('Dandelion chart parameter `size_arr_` not valid')

        return
    }



    if(typeof position_arr_ !== 'object' || position_arr_.length !== 2){
        console.log('Dandelion chart parameter `position_arr_` not valid')

        return
    }





    // 定义变量
    let state_vector = state_vectors_ || 'parameter error'


    let all_possible_states = states || 'parameter error'
    let bundle_g = bundle_g_ || 'parameter error'
    let size_arr = size_arr_ || 'parameter error'
    let position_arr = position_arr_ || 'parameter error'



    ////////////////////////// 开始画图 ////////////////////////////////


    // 定义长宽
    const [container_width, container_height] = size_arr
    const view_margin_left = 0, view_margin_top = 0
    const view_padding_left = 10, view_padding_top = 10


    // 定义位置
    const [container_x, container_y] = position_arr





    // 实际的圆心关于 state 点的偏置
    let theta = theta_ || 1// theta是缩小半径 r 的参数
    let opacity = 0.8
    let point_r = 8





    let view = bundle_g.append('g') // 外面套的边框是 黑色的border
        .attr('class', function(){
            return `dandelion_container dandelion_container_index_${d3.selectAll('.dandelion_container').size()}`
        })
        .attr('transform', `translate(${container_x+view_margin_left},${container_y+view_margin_top})`)





    // 画container的边框
    let border = view.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', container_width)
        .attr('height', container_height)
        .attr('rx', 0)
        .attr('stroke', '#000000')
        .attr('stroke-width', '1px')
        .attr('fill', '#ffffff')





    let content_width = container_width  - 2*view_padding_left
    let content_height = container_height - 2*view_padding_top





    // 画内部的content所有元素
    let content_g = view.append('g')
        .attr('transform', `translate(${view_padding_left}, ${view_padding_top})`)
        .attr('class', `content_g`)




    //////////////////// 添加 横竖 两个坐标轴 ////////////////////////


    let scale_x = d3.scaleLinear()
        .domain([-1,1])
        .range([0, content_width])


    let scale_y = d3.scaleLinear()
        .domain([-1,1])
        .range([content_height, 0])




    // 结合 state_vector 和 all_possible_states
    if(state_vector.length !== all_possible_states.length){
        console.log('`state_vector` and `all_possible_states` length do not match')

        return
    }

    const view_data = all_possible_states.map((d,i)=>{
        let obj = {}

        obj['name'] = d
        obj['state_vector'] = state_vector[i]

        return obj
    })



    let scale_new_x = d3.scaleLinear()
        .domain([-1, 1])
        .range([-content_width/2, content_width/2])



    let scale_new_y = d3.scaleLinear()
        .domain([-1, 1])
        .range([content_width/2, -content_width/2])


    let exp = 1

    let scale_new_x_pow = d3.scalePow()
        .domain([-1, 1])
        .range([-content_width/2, content_width/2])
        .exponent(exp)


    let scale_new_y_pow = d3.scalePow()
        .domain([-1, 1])
        .range([content_width/2, -content_width/2])
        .exponent(exp)



    //////////////////////// 画 原点到 state 的 g (包括state的点，到原点的连线，还有两根到坐标轴的线)
    let state_g0 = content_g.selectAll('.null')
        .data(view_data)
        .join('g')
        .attr('class', d=>`${d['name']}_g`)
        .attr('id', 'state_g')
        .attr('transform', d=>`translate(${scale_x(d['state_vector'][0])}, ${scale_y(d['state_vector'][1])})`)



    let state_g = content_g.selectAll('.null')
        .data(view_data)
        .join('g')
        .attr('class', d=>`${d['name']}_g`)
        .attr('transform', d=>`translate(${scale_x(d['state_vector'][0])}, ${scale_y(d['state_vector'][1])})`)





    // 画state_g 代表 prob 的圆
    state_g0.append('circle')
        .attr('id', 'dandelion_circle')
        .attr("r", d=>Math.sqrt(Math.pow(-scale_new_x_pow(d['state_vector'][0]) * theta, 2) + Math.pow(-scale_new_y_pow(d['state_vector'][1]) * theta, 2)))
        .attr("cx", d=>-scale_new_x_pow(d['state_vector'][0]) * theta)
        .attr("cy", d=>-scale_new_y_pow(d['state_vector'][1]) * theta)
        .style("stroke", (d,i)=>state_color_point[d['name']])
        .style("stroke-width", 1)
        .style("fill", (d,i)=>state_color_fill[d['name']])
        .style('opacity', opacity)




    // 添加 x-axis
    content_g.append('g')
        .attr('class', 'view_axis_x')
        .attr('transform', `translate(${0}, ${content_height/2})`)
        .call(d3.axisTop(scale_x)
            .tickValues([-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1])
            .tickFormat(function (d){
                return [-1, -0.6, -0.2, 0.2, 0.6, 1].includes(d)? d: null
            })
            .tickSize(6)
        )
        .append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "end")
        .attr("x", content_width)
        .attr("y", 13)
        .style('font-size', '1.2em')
        .text("Real")
        .attr('fill', '#000000')





    // 添加 y-axis
    content_g.append('g')
        .attr('class', 'view_axis_y')
        .attr('transform', `translate(${content_width/2}, ${0})`)
        .call(d3.axisRight(scale_y)
            .tickValues([-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1])
            .tickFormat(function (d){
                return [-1, -0.6, -0.2, 0.2, 0.6, 1].includes(d)? d: null
            })
            .tickSize(6)
        )
        .append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", -3)
        .style('font-size', '1.2em')
        .text("Imag.")
        .attr('fill', '#000000')
        .attr('transform', 'rotate(-90)')










    // 画 state_g 到原点的线
    state_g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', d=>-scale_new_x(d['state_vector'][0]))
        .attr('y2', d=>-scale_new_y(d['state_vector'][1]))
        .style('stroke', '#262626')
        .style('stroke-width', 1)







    // 画state_g 到两个坐标轴的线
    // 实部----x-----到y轴
    state_g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', d=>-scale_new_x(d['state_vector'][0]))
        .attr('y2', 0)
        .style('stroke', '#005a89')
        .style('stroke-width', 1)
        .attr('stroke-dasharray', 3)




    // 实部----y-----到x轴
    state_g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', d=>-scale_new_y(d['state_vector'][1]))
        .style('stroke', '#790077')
        .style('stroke-width', 1)
        .attr('stroke-dasharray', 4)





    // 代表 state 的 point
    let points = state_g.append('circle')
        .attr('id', `view3_point`)
        .attr("r", point_r)
        .attr("cx", 0)
        .attr("cy", 0)
        // .style("stroke", "#7a0099")
        // .style("stroke-width", 1)
        .style("fill", (d,i)=>state_color_point[d['name']])



    // 画 每个state的 label
    // state_g2.append('text')
    //     .html(d=>`|${ d['name']}&#x27E9`)
    //     .attr('transform', d=>`translate(${scale_new(d['state_vector'][0])/3}, ${scale_new(d['state_vector'][1])/3})`)
    //     .style('font-size', '1.2em')
    //     .style('fill', '#1d1d1d')



    // 添加每个state的title
    state_g0
        .append("title")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .html(d=>`|${ d['name']}&#x27E9: ${d['state_vector']}`)

    points
        .append("title")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .html(d=>`|${ d['name']}&#x27E9: ${d['state_vector']}`)













}







export default dandelion_chart