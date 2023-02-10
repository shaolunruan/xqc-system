import React, { useState, useEffect, useRef  } from 'react';
import * as d3 from 'd3'



function Try(props){

    // const [param] = useState(props.param) /////为啥不行？？// 因为useState的初始化只执行一次


    const param = props.param || 0

    //定义是否mount的ref
    const didMount = useRef(false)





    function render_view(){

        console.log('render view', param)



        if(d3.selectAll('#svgContainer svg').size() !== 0){
            return
        }


        let svg1 = d3.select('#svgContainer')
            .append('svg')
            .attr('class', 'svg1')
            .attr('width', 400)
            .attr('height', 400)
            .style('border', 'solid 2px #000')

        let svg2 = d3.select('#svgContainer')
            .append('svg')
            .attr('width', 400)
            .attr('height', 400)
            .style('border', 'solid 2px #f00')


        let svg3 = d3.select('#svgContainer')
            .append('svg')
            .attr('width', 400)
            .attr('height', 400)
            .style('border', 'solid 2px #0f0')



        let svg4= d3.select('#svgContainer')
            .append('svg')
            .attr('width', 400)
            .attr('height', 400)
            .style('border', 'solid 2px #00f')


        svg1.append('circle')
            .attr('class', 'svg1_circle')
            .attr('cx', 200)
            .attr('cy', 200)
            .attr('r', 100)
            .style('fill', '#747474');

    }

    function update_view(param){

        d3.selectAll('.svg1_circle')
            .attr('r', +param)

        console.log('update view', param)

    }









    // mount 的时候渲染一次
    useEffect(()=>{
        render_view()

        return ()=>{
            console.log('unmount')
        }
    }, [])




    // mount + update params的时候都会调用
    useEffect(()=>{


        if(!didMount.current){
            didMount.current = true

            return
        }


        update_view(param)

    }, [param])





    return (
        <div id="svgContainer"></div>
    )

}

export default Try