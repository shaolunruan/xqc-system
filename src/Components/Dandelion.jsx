import React, { useState, useEffect, useRef  } from 'react';
import axios from 'axios'
import dandelion_chart from "../function/dandelion_chart";
import * as d3 from 'd3'


import {colorMap_circle_fill, colorMap_circle_border, colorMap_point} from "../function/view1_colorScheme";
import {state_dark, state_Light, state_light} from "../function/color_scheme";


function Dandelion(props){


    const param_algo = props.param_algo
    const statevector = props.statevector
    const theta = props.theta || 1
    const setPoint_radius = props.point_radius || 8


    //定义是否mount的ref
    const didMount1 = useRef(false)
    const didMount2 = useRef(false)
    const didMount3 = useRef(false)
    const states = useRef([])
    const svg = useRef()

    // 数据存这儿
    let data = useRef({})





    function add_dandelion(statevector){

        // 四个prob：0.2， 0.25， 0.05， 0.5
        // let state_vector = [
        //     [0.13, 0.428],
        //     [0.07, -0.495],
        //     [0.1, 0.2],
        //     [0.4, 0.3]
        // ]


        // 四个prob：0.25, 0.25, 0.25, 0.25
        // let state_vector = [
        //     [0.5, 0],
        //     [0.5, 0],
        //     [-0.5, 0],
        //     [0.5, 0]
        // ]


        // let state_vectors = [
        //     [
        //         [0.13, 0.428],
        //         [0.07, -0.495],
        //         [0.1, 0.2],
        //         [0.4, 0.3]
        //     ],
        //     [
        //         [0.13, 0.428],
        //         [0.07, -0.495],
        //         [0.1, 0.2],
        //         [0.4, 0.3]
        //     ]
        // ]




        // 四个prob：0.2， 0.25， 0.05， 0.5
        let state_vector_1 =
            statevector[0] ||
            [
            [-0.13, 0.428],
            [0.07, -0.495],
            [-0.1, -0.2],
            [0.5, 0.5]
        ]


        let state_vector_2 =
            statevector[1] ||
            [
            [0.13, 0.428],
            [0.07, -0.495],
            [0.1, 0.2],
            [0.4, 0.3]
        ]





        /////////////// 定义一些变量 ///////////////
        const dandelion_width = 315, dandelion_height = 315
        const dandelion_gap = 70
        const bundle_width = dandelion_width*2 + dandelion_gap
        const bundle_height = dandelion_width
        const view_margin_left = 30, view_margin_top = 30

        const link_label_bg_size = 30
        const padding = 20


        let num = d3.selectAll('.bundle_container').size()





        // 根据已经有的bundle来调整整个svg的大小
        if(!svg.current){
            return
        }
        svg.current.attr('height', (num+1)*(bundle_height+dandelion_gap))


        let bundle_g = svg.current
            .append('g')
            .attr('class', function(){
                return `bundle_container bundle_container_index_${d3.selectAll('.bundle_container').size()}`
            })
            .attr('transform', `translate(${view_margin_left},${view_margin_top + num*(bundle_height+dandelion_gap)})`)


        // 加一个bundle的白色背景
        bundle_g.append('rect')
            .attr('x', -padding)
            .attr('y', -padding)
            .attr('width', bundle_width+ 2*padding)
            .attr('height', bundle_height+ 2*padding)
            .attr('rx', 15)
            .attr('fill', '#ffffff')
            // .attr('stroke', "#2f2f2f")
            // .attr('stroke-width', '2px')


        let n1 = Math.log2(state_vector_1.length)
        let state_names_1 = generateStates(n1).sort()


        let n2 = Math.log2(state_vector_2.length)
        let state_names_2 = generateStates(n2).sort()


        // return;


        /////////////////////// 在这里调用 dandelion_chart 函数 /////////////////////
        dandelion_chart(state_vector_1, state_names_1, bundle_g, [dandelion_width, dandelion_width], [0,0], theta)
        dandelion_chart(state_vector_2, state_names_2, bundle_g, [dandelion_width, dandelion_width], [dandelion_width+dandelion_gap,0], theta)



        let link_g = bundle_g.append('g')
            .attr('transform', `translate(${dandelion_width},${dandelion_height/2})`)


        // 连接两个dandelion chart的连线
        // let link = link_g.append('line')
        //     .attr('class', 'bundle_link ')
        //     .attr('id', 'path_animation')
        //     .attr('x1', 0)
        //     .attr('y1', 0)
        //     .attr('x2', dandelion_gap)
        //     .attr('y2', 0)
        //     .style('stroke', '#3c74f3')
        //     .style('stroke-width', 5)
        //     .attr('stroke-dasharray', `8 3`)

        let link = link_g.append('path')
            .attr('id', 'path_animation_dandelion')
            .attr('d', function(){


                return "M" + 0 + "," + 0
                    + " " + dandelion_gap + "," + 0;
            })
            .attr('stroke', '#d5b1f8')
            .attr('stroke-width', 5)



        // // 画 gate label
        link_g.append('rect')
            .attr('x', dandelion_gap/2-link_label_bg_size/2)
            .attr('y', -link_label_bg_size/2)
            .attr('width', link_label_bg_size)
            .attr('height', link_label_bg_size)
            // .attr('rx', rx)
            .attr('fill', '#ffffff')


        let gate_label = link_g.append('text')
            .html(d=>{

                let dandelion_chart_num = d3.selectAll('.bundle_container').size()-1

                return d3.select(`#dandelion_id_${dandelion_chart_num}`).attr('class')

            })
            .attr('transform', `translate(${dandelion_gap/2 - 15}, ${10})`)
            .style('font-size', '2.5em')
            .style('fill', '#aa37e8')
            .style('font-weight', 'bold')
            .style('font-style', 'italic')




    }


    // 生成 binary的string
    function generateStates(n){
        var states = [];

        // Convert to decimal
        var maxDecimal = parseInt("1".repeat(n),2);

        // For every number between 0->decimal
        for(var i = 0; i <= maxDecimal; i++){
            // Convert to binary, pad with 0, and add to final results
            states.push(i.toString(2).padStart(n,'0'));
        }

        return states;
    }




    // mount 的时候渲染一次
    useEffect(()=>{

        let file_name = param_algo


        axios.get(`data/${file_name}.json`)
            // axios.get(`data/temp.json`)
            .then(res=>{

                data.current = res.data



                // 统计所有出现的states，e.g., ['00', '01', '10', '11']
                states.current = Object.values(data.current).reduce((arr, d)=>{

                    Object.values(d).forEach(d0=>{

                        Object.values(d0['hubs']).forEach(_d=>{
                            Object.values(_d['states']).forEach(__d=>{
                                if(!arr.includes(__d['state'])){
                                    arr.push(__d['state'])
                                }
                            })
                        })
                    })

                    return arr

                }, [])
                    .sort()// 按 ['00', '01', '10', '11'] 这样的顺序排序





                /////////////// 定义一些变量 ///////////////

                const svg_width = 800, svg_height = 360




                // 创建 svg 画布
                svg.current = d3.select('#dandelion_container')
                    .append('svg')
                    .attr('width', svg_width)
                    .attr('height', svg_height)
                    .attr('class', `view_svg`)



            })



    }, [])



    // 情况一：当 statevector 更新的时候update
    useEffect(()=>{


        // 跳过第一次 mount
        if(!didMount1.current){
            didMount1.current = true

            return
        }

        add_dandelion(statevector)

        console.log('Dandelion update - statevector')


    }, [statevector])




    // 情况二：当 theta 更新的时候update
    useEffect(()=>{


        // 跳过第一次 mount
        if(!didMount2.current){
            didMount2.current = true

            return
        }


        // 定义长宽
        const container_width = d3.select('.dandelion_container ').select('rect').attr('width')
        const container_height = d3.select('.dandelion_container ').select('rect').attr('height')
        const view_padding_left = 10, view_padding_top = 10

        let exp = 1


        let content_width = container_width  - 2*view_padding_left
        let content_height = container_height - 2*view_padding_top


        let scale_new_x_pow = d3.scalePow()
            .domain([-1, 1])
            .range([-content_width/2, content_width/2])
            .exponent(exp)


        let scale_new_y_pow = d3.scalePow()
            .domain([-1, 1])
            .range([content_width/2, -content_width/2])
            .exponent(exp)



        // 先清除所有的旧circle
        d3.selectAll(`#dandelion_circle`)
            .remove()



        // 根据新的theta 渲染新的circle
        d3.selectAll('#state_g')
            .append('circle')
            .attr('id', 'dandelion_circle')
            .attr("r", d=>Math.sqrt(Math.pow(-scale_new_x_pow(d['state_vector'][0]) * theta, 2) + Math.pow(-scale_new_y_pow(d['state_vector'][1]) * theta, 2)))
            .attr("cx", d=>-scale_new_x_pow(d['state_vector'][0]) * theta)
            .attr("cy", d=>-scale_new_y_pow(d['state_vector'][1]) * theta)
            .style("stroke", (d,i)=>state_dark[d['name']])
            .style("stroke-width", 1)
            .style("fill", (d,i)=>state_light[d['name']])
            .style('opacity', 0.8)


        console.log(`Dandelion update - theta ${theta}`)


    }, [theta])




    // 情况三：当 statevector 更新的时候update
    useEffect(()=>{


        // 跳过第一次 mount
        if(!didMount3.current){
            didMount3.current = true

            return
        }

        d3.selectAll('#view3_point')
            .attr("r", setPoint_radius)


        console.log('Dandelion update - point_size')


    }, [setPoint_radius])



    // 情况四：换 algo时重新刷新 dandelion chart
    useEffect(()=>{


        // 跳过第一次 mount
        if(!didMount3.current){
            didMount3.current = true

            return
        }


        // 删除dandelion chart
        d3.selectAll('.bundle_container')
            .remove()

        d3.select('.view_svg')
            .attr('width', 800)
            .attr('height', 360)


    }, [param_algo])







    return (

        <>
            <div id="dandelion_container" style={{height: '1400px', overflow: 'scroll'}}></div>
        </>

    )

}

export default Dandelion